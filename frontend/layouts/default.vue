<template>
<div class="page">
  <Nuxt />

  <span class="sauce">Alle code van deze checker staat op <a href="https://github.com/Pwuts/leakbook">GitHub</a></span>
</div>
</template>

<style>
html {
  font-family:
    'Source Sans Pro',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  font-size: 18px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
}

.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  text-align: center;
}
main {
  flex: auto;
  padding: 1em;
}

.sauce {
  margin: 1em auto 1em;
}
</style>
