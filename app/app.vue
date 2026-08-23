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
  { label: 'Início', description: 'Visão geral da plataforma', icon: 'i-lucide-house', to: '/' },
  { label: 'Conteúdos', description: 'Assuntos e materiais para estudar', icon: 'i-lucide-library-big', to: '/conteudos' },
  { label: 'Questões', description: 'Pratique com provas anteriores', icon: 'i-lucide-list-checks', to: '/questoes' },
  { label: 'Jogos', description: 'Aprenda por meio de desafios', icon: 'i-lucide-gamepad-2', to: '/jogos' },
  { label: 'Perfil', description: 'Acompanhe seu desempenho', icon: 'i-lucide-user-round', to: '/perfil' }
]
const route = useRoute()
const mobileMenuOpen = ref(false)
const showBackToTop = ref(false)

function isNavigationActive(to: string) {
  return to === '/'
    ? route.path === '/'
    : route.path === to || route.path.startsWith(`${to}/`)
}

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
      v-model:open="mobileMenuOpen"
      title="OpenVest"
      to="/"
    >
      <UNavigationMenu :items="navigation" />

      <template #right>
        <UColorModeButton aria-label="Alternar tema" />
      </template>

      <template #toggle="{ open, toggle }">
        <UButton
          :label="open ? 'Fechar' : 'Menu'"
          :icon="open ? 'i-lucide-x' : 'i-lucide-menu'"
          :aria-expanded="open"
          aria-controls="mobile-navigation"
          color="neutral"
          variant="ghost"
          class="lg:hidden"
          @click="toggle"
        />
      </template>

      <template #body>
        <nav
          id="mobile-navigation"
          aria-label="Navegação principal"
          class="flex flex-col gap-5"
        >
          <ul class="grid gap-2">
            <li
              v-for="item in navigation"
              :key="item.to"
            >
              <NuxtLink
                :to="item.to"
                :aria-current="isNavigationActive(item.to) ? 'page' : undefined"
                class="group flex min-h-20 items-center gap-4 rounded-xl border px-4 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                :class="isNavigationActive(item.to)
                  ? 'border-primary/50 bg-primary/10 text-highlighted'
                  : 'border-default bg-elevated/50 text-toned hover:border-accented hover:bg-elevated'"
                @click="mobileMenuOpen = false"
              >
                <span
                  class="flex size-11 shrink-0 items-center justify-center rounded-lg"
                  :class="isNavigationActive(item.to)
                    ? 'bg-primary text-inverted'
                    : 'bg-accented text-highlighted group-hover:bg-muted'"
                >
                  <UIcon
                    :name="item.icon"
                    class="size-5"
                  />
                </span>

                <span class="min-w-0 flex-1">
                  <span class="flex items-center gap-2 font-semibold">
                    {{ item.label }}
                    <UBadge
                      v-if="isNavigationActive(item.to)"
                      label="Atual"
                      color="primary"
                      variant="subtle"
                      size="sm"
                    />
                  </span>
                  <span class="mt-0.5 block text-sm text-muted">
                    {{ item.description }}
                  </span>
                </span>

                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-5 shrink-0 text-dimmed transition-transform group-hover:translate-x-0.5"
                />
              </NuxtLink>
            </li>
          </ul>
        </nav>
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
