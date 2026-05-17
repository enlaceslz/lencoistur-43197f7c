import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { action, payload } = body

    if (action === 'save_term') {
      const { 
        termId, accessToken, bookingCode, customerName, nationality, phone, email, 
        cpf, birthDate, tourName, risksInformed, healthQuestions, signatureData,
        minors, pdfBase64, pdfFileName
      } = payload

      if (!termId || !accessToken) {
        return new Response(JSON.stringify({ error: 'Term ID and Access Token are required for signing.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Validate token and existence
      const { data: existingTerm, error: termError } = await supabaseAdmin
        .from('sgs_risk_terms')
        .select('id, sign_access_token, sign_access_expires_at, booking_id, customer_id, accepted')
        .eq('id', termId)
        .maybeSingle()

      if (termError || !existingTerm) {
        return new Response(JSON.stringify({ error: 'Term record not found.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (existingTerm.sign_access_token !== accessToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid access token.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (existingTerm.sign_access_expires_at && new Date(existingTerm.sign_access_expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Access token has expired.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Resource limits
      if (pdfBase64 && pdfBase64.length > 7000000) { // Approx 5MB
        return new Response(JSON.stringify({ error: 'PDF file too large (max 5MB).' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (minors && Array.isArray(minors) && minors.length > 20) {
        return new Response(JSON.stringify({ error: 'Too many companions (max 20).' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Prevent replay: reject if already accepted
      if (existingTerm.accepted) {
        return new Response(JSON.stringify({ error: 'This term has already been signed.' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      let currentTermId = termId
      // Trust only the server-stored ids, never the client payload
      const trustedBookingId = existingTerm.booking_id
      const trustedCustomerId = existingTerm.customer_id

      // 1. Insert or Update sgs_risk_terms
      const termRecord = {
        customer_name: customerName,
        nationality,
        phone,
        email,
        cpf,
        birth_date: birthDate,
        tour_name: tourName,
        risks_informed: risksInformed,
        health_questions: healthQuestions,
        safety_controls_informed: true,
        accepted: true,
        signature_data: signatureData,
        signed_at: new Date().toISOString(),
        term_date: new Date().toISOString().split('T')[0],
      }

      const { error: updateError } = await supabaseAdmin
        .from('sgs_risk_terms')
        .update(termRecord)
        .eq('id', currentTermId)
      
      if (updateError) throw updateError

      // 2. Manage Minors
      if (minors && Array.isArray(minors)) {
        for (const minor of minors) {
          const { data: existingMinor } = await supabaseAdmin
            .from('sgs_risk_term_minors')
            .select('id')
            .eq('risk_term_id', currentTermId)
            .eq('full_name', minor.full_name)
            .maybeSingle()

          const minorPayload = {
            risk_term_id: currentTermId,
            full_name: minor.full_name,
            is_adult: minor.is_adult,
            responsible_name: minor.responsible_name,
            signature_data: minor.signature_data,
            cpf: minor.cpf,
            birth_date: minor.birth_date,
            signed_at: new Date().toISOString()
          }

          if (existingMinor) {
            await supabaseAdmin.from('sgs_risk_term_minors').update(minorPayload).eq('id', existingMinor.id)
          } else {
            await supabaseAdmin.from('sgs_risk_term_minors').insert([minorPayload])
          }
        }
      }

      // 3. Upload PDF if provided
      if (pdfBase64 && pdfFileName) {
        const binaryPdf = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0))
        const filePath = `termos_assinados/${pdfFileName}`
        
        const { error: uploadError } = await supabaseAdmin.storage
          .from('customer-documents')
          .upload(filePath, binaryPdf, {
            contentType: 'application/pdf',
            upsert: true
          })

        if (!uploadError) {
          // Update term with pdf_url
          await supabaseAdmin.from('sgs_risk_terms').update({ pdf_url: filePath }).eq('id', currentTermId)
          
          // Add to customer_documents
          if (trustedCustomerId) {
            await supabaseAdmin.from('customer_documents').insert([{
              customer_id: trustedCustomerId,
              name: `Termo Assinado - ${tourName}`,
              file_url: filePath,
              file_type: 'application/pdf',
              category: 'termo'
            }])
          }

          // Add to generic Documents module
          await supabaseAdmin.from('documents').insert([{
            name: `Termo Assinado - ${tourName} - ${bookingCode || 'SGS'}`,
            type: 'termo_assinado',
            description: `Termo assinado por ${customerName} em ${new Date().toLocaleDateString('pt-BR')}`,
            file_url: filePath,
            file_name: pdfFileName,
            status: 'vigente'
          }])
        }
      }

      // 4. Update booking status (use server-stored booking_id only)
      if (trustedBookingId) {
        await supabaseAdmin.from('bookings').update({ 
          status: 'confirmada',
          updated_at: new Date().toISOString()
        }).eq('id', trustedBookingId).eq('status', 'pendente')
      }

      return new Response(JSON.stringify({ success: true, termId: currentTermId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
