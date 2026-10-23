<template>
  <main
    class="grid min-h-screen bg-slate-50 lg:grid-cols-[minmax(360px,.88fr)_minmax(480px,1.12fr)]"
  >
    <slot name="brand" />
    <section class="grid place-items-center bg-white p-6 sm:p-8">
      <div class="w-full max-w-md"><slot /></div>
    </section>
  </main>
</template>
