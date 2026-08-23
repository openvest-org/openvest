<script setup lang="ts">
const heroLinks = [
  {
    label: 'Conheça a proposta',
    to: '#proposta',
    trailingIcon: 'i-lucide-arrow-down',
    size: 'xl' as const
  }
]

const principles = [
  {
    icon: 'i-lucide-lock-open',
    title: 'Acesso livre',
    description: 'Conteúdo gratuito, sem paywall e pensado para continuar assim.'
  },
  {
    icon: 'i-lucide-code-2',
    title: 'Conhecimento aberto',
    description: 'Um projeto de código aberto, construído para ser consultado e aprimorado.'
  },
  {
    icon: 'i-lucide-map',
    title: 'Contexto brasileiro',
    description: 'Estudo organizado a partir da realidade dos vestibulares do país.'
  }
]
</script>

<template>
  <UPage>
    <UPageHero
      title="Um lugar aberto para estudar o que abre caminhos."
      description="O OpenVest está nascendo para reunir conteúdos e ferramentas gratuitas para quem se prepara para os vestibulares."
      :links="heroLinks"
    />

    <UPageSection
      id="proposta"
      headline="Nossa proposta"
      title="Estudar com autonomia, sem cobrar nada por isso."
      description="Uma plataforma gratuita, aberta e feita a partir da realidade de quem se prepara para o vestibular no Brasil."
      :features="principles"
    />

    <UPageSection>
      <UPageCTA
        title="Projeto em construção..."
        variant="subtle"
      />
    </UPageSection>
  </UPage>
</template>
