
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64, recordId } = await req.json()
    
    if (!imageBase64 || !recordId) {
      throw new Error('Missing required parameters')
    }

    // OCR.Space API call
    const formData = new FormData()
    formData.append('base64Image', `data:image/jpeg;base64,${imageBase64}`)
    formData.append('apikey', Deno.env.get('OCR_SPACE_API_KEY') || 'helloworld')
    formData.append('language', 'eng')
    formData.append('isOverlayRequired', 'false')
    formData.append('detectOrientation', 'false')
    formData.append('scale', 'true')
    formData.append('OCREngine', '2')

    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    })

    const ocrResult = await ocrResponse.json()
    
    if (!ocrResult.IsErroredOnProcessing && ocrResult.ParsedResults?.length > 0) {
      const extractedText = ocrResult.ParsedResults[0].ParsedText
      const confidence = ocrResult.ParsedResults[0].TextOverlay?.HasOverlay ? 0.8 : 0.6

      // Update medical record with OCR results
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabase
        .from('medical_records')
        .update({
          extracted_text: extractedText,
          ocr_confidence: confidence,
          ocr_provider: 'ocr_space'
        })
        .eq('id', recordId)

      // Log API usage
      const authHeader = req.headers.get('Authorization')
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        
        if (user) {
          await supabase.from('api_usage_logs').insert({
            user_id: user.id,
            api_provider: 'ocr_space',
            endpoint: '/parse/image',
            request_data: { has_image: true, record_id: recordId },
            response_data: { success: true, confidence },
            status_code: 200
          })
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          extractedText, 
          confidence 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      throw new Error('OCR processing failed')
    }

  } catch (error) {
    console.error('OCR Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
