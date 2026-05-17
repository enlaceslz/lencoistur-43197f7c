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
        termId, bookingId, customerId, customerName, nationality, phone, email, 
        cpf, birthDate, tourName, risksInformed, healthQuestions, signatureData,
        minors, pdfBase64, pdfFileName
      } = payload

      let currentTermId = termId

      // 1. Insert or Update sgs_risk_terms
      const termRecord = {
        booking_id: bookingId,
        customer_id: customerId,
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

      if (!currentTermId) {
        const { data: newTerm, error: termError } = await supabaseAdmin
          .from('sgs_risk_terms')
          .insert([termRecord])
          .select()
          .single()
        
        if (termError) throw termError
        currentTermId = newTerm.id
      } else {
        const { error: termError } = await supabaseAdmin
          .from('sgs_risk_terms')
          .update(termRecord)
          .eq('id', currentTermId)
        
        if (termError) throw termError
      }

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
          if (customerId) {
            // Since it's a private bucket, we store the path, but the UI might need a URL.
            // We'll store the path.
            await supabaseAdmin.from('customer_documents').insert([{
              customer_id: customerId,
              name: `Termo Assinado - ${tourName}`,
              file_url: filePath, // Note: storing path instead of public URL
              file_type: 'application/pdf',
              category: 'termo'
            }])
          }
        }
      }

      // 4. Update booking status
      if (bookingId) {
        await supabaseAdmin.from('bookings').update({ 
          status: 'confirmada',
          updated_at: new Date().toISOString()
        }).eq('id', bookingId).eq('status', 'pendente')
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
