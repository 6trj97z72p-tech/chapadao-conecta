import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
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

    const url = new URL(request.url)
    const force = url.searchParams.get('force') === '1'

    const resposta = await fetch('https://www.sistema-alerta-rio.com.br/tabela-de-dados/', {
      cache: 'no-store',
    })

    const html = await resposta.text()
    const texto = html.toLowerCase()

    const alertaCritico =
  texto.includes('estágio de alerta') ||
  texto.includes('estagio de alerta') ||
  texto.includes('chuva forte') ||
  texto.includes('tempestade')

const alertaAtencao =
  texto.includes('chuva') ||
  texto.includes('pancadas') ||
  texto.includes('instabilidade') ||
  texto.includes('mudança do tempo') ||
  texto.includes('mudanca do tempo')

    if (!alertaCritico && !alertaAtencao && !force) {
      return NextResponse.json({
        ok: true,
        alerta: false,
        mensagem: 'Nenhum alerta oficial crítico encontrado no Alerta Rio neste momento.',
      })
    }

    const bairros = [
      'Pavuna',
      'Costa Barros',
      'Anchieta',
      'Guadalupe',
      'Ricardo de Albuquerque',
    ]

    const resultados = []

    const nivel = force
  ? 'CRITICO'
  : alertaCritico
  ? 'CRITICO'
  : 'ATENCAO'
    
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
          nivel,
          local_descricao: 'Região atendida pelo Chapadão Conecta',
          descricao: force
            ? 'Alerta oficial de teste gerado manualmente para validação da integração.'
            : 'Alerta oficial identificado a partir do monitoramento público do Sistema Alerta Rio.',
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
      alerta: true,
      origem: 'Alerta Rio / Prefeitura do Rio',
      modo: force ? 'teste manual' : 'monitoramento oficial',
      resultados,
    })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }
}
