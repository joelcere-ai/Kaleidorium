import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Test OpenAI API key
const testApiKey = async (apiKey: string) => {
  try {
    const config: any = {
      apiKey,
      baseURL: 'https://api.openai.com/v1',
      defaultHeaders: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'project-apis-2024-03'
      }
    }
    
    const openai = new OpenAI(config)
    
    // Try a simple test request
    const test = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using a simpler model for testing
      messages: [{ role: "user", content: "test" }],
      max_tokens: 1 // Minimal response to save tokens
    })
    
    return {
      valid: true,
      message: "API key is valid and has required permissions"
    }
  } catch (error: any) {
    console.error('API Key Test Error:', {
      message: error.message,
      type: error.type,
      status: error.status,
      code: error.code
    })
    
    return {
      valid: false,
      message: error.message,
      details: {
        type: error.type,
        status: error.status,
        code: error.code
      }
    }
  }
}

// Initialize OpenAI with error handling
const getOpenAIClient = async () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('OPENAI_API_KEY environment variable is missing')
    throw new Error('OpenAI API key is not configured')
  }
  
  // Test the API key first
  const keyTest = await testApiKey(apiKey)
  if (!keyTest.valid) {
    console.error('OpenAI API key validation failed:', keyTest)
    throw new Error(`Invalid API key: ${keyTest.message}`)
  }
  
  // Log API key configuration status
  console.log('OpenAI Configuration:', {
    keyExists: !!apiKey,
    keyType: apiKey.startsWith('sk-proj-') ? 'project' : 'standard',
    keyLength: apiKey.length,
    keyStatus: 'valid'
  })
  
  try {
    const config: any = {
      apiKey,
      baseURL: 'https://api.openai.com/v1',
      defaultHeaders: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'project-apis-2024-03'
      }
    }
    
    return new OpenAI(config)
  } catch (error) {
    console.error('Error initializing OpenAI client:', error)
    throw new Error('Failed to initialize OpenAI client')
  }
}

export async function POST(request: Request) {
  console.log('Received recommendation request')
  
  try {
    // Initialize OpenAI client
    const openai = await getOpenAIClient()
    console.log('OpenAI client initialized successfully')

    // Parse request body with error handling
    const body = await request.json().catch((error) => {
      console.error('Error parsing request body:', error)
      throw new Error('Invalid request body format')
    })

    const { preferences, artworks } = body
    console.log('Request data received:', {
      hasPreferences: !!preferences,
      artworksCount: artworks?.length
    })

    // Validate request data
    if (!preferences) {
      console.error('Missing preferences in request')
      throw new Error('Preferences are required')
    }

    if (!artworks || !Array.isArray(artworks) || artworks.length === 0) {
      console.error('Invalid artworks data:', { artworksLength: artworks?.length })
      throw new Error('Valid artworks array is required')
    }

    // Log request data summary
    console.log('Processing request with:', {
      preferencesCategories: Object.keys(preferences),
      artworksCount: artworks.length
    })

    // Construct the prompt
    const prompt = `Given these user preferences and artworks, return a JSON array of artwork IDs ordered by recommendation priority.
          
Preferences (higher = stronger preference):
${JSON.stringify(preferences, null, 2)}

Available artworks:
${JSON.stringify(artworks.map((a: any) => ({
  id: a.id,
  title: a.title,
  style: a.style,
  genre: a.genre,
  subject: a.subject,
  colour: a.colour
})), null, 2)}

Return format: {"recommendations": ["id1", "id2", "id3"]}`

    console.log('Making OpenAI request with model: gpt-4-turbo-preview')

    // Make OpenAI API call with additional error handling
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an art recommendation system. Analyze user preferences and artwork metadata to provide personalized recommendations. Return only a JSON array of artwork IDs in order of recommendation priority."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      })

      console.log('Received response from OpenAI')

      const response = completion.choices[0].message.content
      if (!response) {
        console.error('Empty response from OpenAI')
        throw new Error('No response received from OpenAI')
      }

      // Validate response format
      const parsed = JSON.parse(response)
      if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        console.error('Invalid response format:', response)
        throw new Error('Invalid response format from OpenAI')
      }
      
      console.log('Successfully generated recommendations:', {
        count: parsed.recommendations.length,
        firstFew: parsed.recommendations.slice(0, 3)
      })
      
      return NextResponse.json({ response })
    } catch (error: any) {
      console.error('OpenAI API error:', {
        message: error.message,
        type: error.type,
        code: error.code,
        param: error.param,
        status: error.status,
        headers: error.headers
      })
      throw new Error(`OpenAI API error: ${error.message}`)
    }
  } catch (error: any) {
    console.error('API route error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { 
        error: 'Failed to get recommendations',
        details: error.message,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}

// Add a GET endpoint to test the API key
export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'OpenAI API key is not configured',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    const keyTest = await testApiKey(apiKey)
    return NextResponse.json({
      status: keyTest.valid ? 'valid' : 'invalid',
      message: keyTest.message,
      details: keyTest.details,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to test API key',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 