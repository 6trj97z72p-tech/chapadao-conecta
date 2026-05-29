import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Variáveis do Supabase não configuradas.' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const bairros = [
      'Pavuna',
      'Costa Barros',
      'Anchieta',
      'Guadalupe',
      'Ricardo de Albuquerque',
    ]

    const resultados = []

    for (const bairro of bairros) {
      const { data: existente } = await supabase
        .from('riscos_emergencias')
        .select('id')
        .eq('bairro', bairro)
        .eq('tipo_emergencia', 'Alerta de Tempestade')
        .eq('origem', 'OFICIAL')
        .eq('status', 'ATIVO')
        .limit(1)

      if (existente && existente.length > 0) {
        resultados.push({ bairro, status: 'já existia' })
        continue
      }

      const { error } = await supabase.from('riscos_emergencias').insert([
        {
          email: 'oficial@alertario.rio',
          bairro,
          tipo_emergencia: 'Alerta de Tempestade',
          local_descricao: 'Região atendida pelo Chapadão Conecta',
          descricao:
            'Alerta oficial de teste integrado ao módulo de Riscos e Emergências.',
          foto_url: null,
          status: 'ATIVO',
          origem: 'OFICIAL',
          fonte: 'Alerta Rio / Prefeitura do Rio',
        },
      ])

      if (error) {
        resultados.push({ bairro, status: 'erro', error: error.message })
      } else {
        resultados.push({ bairro, status: 'criado' })
      }
    }

    return NextResponse.json({
      ok: true,
      origem: 'Alerta Rio / Prefeitura do Rio',
      resultados,
    })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }
}
