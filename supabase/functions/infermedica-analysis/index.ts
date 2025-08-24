
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
    const { symptoms, age, sex, medicalHistory } = await req.json()
    
    if (!symptoms || symptoms.length === 0) {
      throw new Error('No symptoms provided')
    }

    const infermedicaAppId = Deno.env.get('INFERMEDICA_APP_ID')
    const infermedicaAppKey = Deno.env.get('INFERMEDICA_APP_KEY')

    if (!infermedicaAppId || !infermedicaAppKey) {
      throw new Error('Infermedica API credentials not configured')
    }

    // Parse symptoms for Infermedica format
    const evidence = symptoms.map((symptom: any) => ({
      id: symptom.symptom_name.toLowerCase().replace(/\s+/g, '_'),
      choice_id: 'present',
      source: 'initial'
    }))

    // Call Infermedica diagnosis API
    const diagnosisResponse = await fetch('https://api.infermedica.com/v3/diagnosis', {
      method: 'POST',
      headers: {
        'App-Id': infermedicaAppId,
        'App-Key': infermedicaAppKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sex: sex || 'male',
        age: { value: age || 30 },
        evidence,
        extras: ['conditions_details', 'risk_factors']
      })
    })

    const diagnosisResult = await diagnosisResponse.json()

    // Get symptom explanations
    const explanationResponse = await fetch('https://api.infermedica.com/v3/explain', {
      method: 'POST',
      headers: {
        'App-Id': infermedicaAppId,
        'App-Key': infermedicaAppKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sex: sex || 'male',
        age: { value: age || 30 },
        evidence,
        target: diagnosisResult.conditions?.[0]?.id || 'c_25'
      })
    })

    const explanationResult = await explanationResponse.json()

    const analysis = {
      conditions: diagnosisResult.conditions?.slice(0, 5) || [],
      should_stop: diagnosisResult.should_stop || false,
      question: diagnosisResult.question,
      explanation: explanationResult,
      confidence_score: diagnosisResult.conditions?.[0]?.probability || 0,
      timestamp: new Date().toISOString()
    }

    // Log API usage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      
      if (user) {
        await supabase.from('api_usage_logs').insert({
          user_id: user.id,
          api_provider: 'infermedica',
          endpoint: '/diagnosis',
          request_data: { symptom_count: symptoms.length },
          response_data: { condition_count: analysis.conditions.length },
          status_code: 200
        })
      }
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Infermedica Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
