export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  ssr: false,
  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt"],
  extends: ["@simone98dm/layer"],
  // cssPath, not the `css` array: the array would load this file *alongside*
  // the module's default one and emit the @tailwind directives twice
  tailwindcss: { cssPath: "~/assets/css/main.css" },
  app: {
    head: {
      title: "SplitMoney",
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      htmlAttrs: {
        lang: "it",
      },
      meta: [
        {
          name: "description",
          content:
            "SplitMoney - dividi le spese di gruppo e chiudi i conti con il minor numero di pagamenti",
        },
        // the browser chrome has to follow the theme too, or the status bar
        // stays black over a light page
        {
          name: "theme-color",
          content: "#09150a",
          media: "(prefers-color-scheme: dark)",
        },
        {
          name: "theme-color",
          content: "#f1f5f1",
          media: "(prefers-color-scheme: light)",
        },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon-16x16.png",
        },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
    },
  },
});
