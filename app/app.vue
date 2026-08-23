<script setup lang="ts">
const siteUrl = useRuntimeConfig().public.siteUrl

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: publicPath('/favicon.ico') }
  ],
  htmlAttrs: {
    lang: 'pt-BR'
  }
})

const title = 'OpenVest'
const description = 'Conteúdos e ferramentas gratuitas e de código aberto para quem se prepara para os vestibulares brasileiros.'
const socialImage = new URL(publicPath('/og.png'), siteUrl).toString()
const navigation = [
  { label: 'Início', icon: 'i-lucide-house', to: '/' },
  { label: 'Questões', icon: 'i-lucide-list-checks', to: '/questoes' },
  { label: 'Perfil', icon: 'i-lucide-user-round', to: '/perfil' }
]
const showBackToTop = ref(false)

function updateBackToTopVisibility() {
  showBackToTop.value = window.scrollY > 400
    && document.documentElement.scrollHeight > window.innerHeight
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  updateBackToTopVisibility()
  window.addEventListener('scroll', updateBackToTopVisibility, { passive: true })
  window.addEventListener('resize', updateBackToTopVisibility)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateBackToTopVisibility)
  window.removeEventListener('resize', updateBackToTopVisibility)
})

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: socialImage,
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: socialImage,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <UHeader
      title="OpenVest"
      to="/"
    >
      <UNavigationMenu :items="navigation" />

      <template #right>
        <UColorModeButton aria-label="Alternar tema" />
      </template>

      <template #content>
        <UNavigationMenu
          :items="navigation"
          orientation="vertical"
        />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter>
      <template #left>
        <UButton
          label="OpenVest"
          to="/"
          color="neutral"
          variant="link"
        />
      </template>

      <template #right>
        <div class="flex items-center gap-2">
          <UButton
            label="GitHub"
            icon="i-lucide-github"
            to="https://github.com/openvest-org/openvest"
            target="_blank"
            rel="noopener noreferrer"
            color="neutral"
            variant="ghost"
          />

          <UBadge
            :label="String(new Date().getFullYear())"
            color="neutral"
            variant="soft"
          />
        </div>
      </template>
    </UFooter>

    <UButton
      v-if="showBackToTop"
      icon="i-lucide-arrow-up"
      aria-label="Voltar ao início da página"
      size="lg"
      class="fixed right-4 bottom-4 z-50"
      @click="scrollToTop"
    />
  </UApp>
</template>
