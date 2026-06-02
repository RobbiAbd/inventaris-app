<template>
  <UDashboardPanel :ui="{ body: 'relative flex flex-col flex-1 min-h-0 overflow-visible p-0' }">
    <template #header>
      <slot name="header" />
    </template>
    <template #body>
      <div class="flex flex-1 flex-col min-h-0 overflow-y-auto p-4 sm:p-6 gap-4 sm:gap-6">
        <slot />
      </div>
    </template>
  </UDashboardPanel>
</template>
