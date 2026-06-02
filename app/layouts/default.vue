<template>
  <UDashboardGroup unit="rem" storage="local">
    <AppSidebar />
    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <slot />
    </div>
  </UDashboardGroup>
</template>
