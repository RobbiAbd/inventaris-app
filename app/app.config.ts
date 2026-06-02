export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate'
    },
    dashboardGroup: {
      base: 'fixed inset-0 flex min-h-0 min-w-0 isolate z-0'
    },
    card: {
      slots: {
        root: 'rounded-lg overflow-visible'
      }
    },
    selectMenu: {
      slots: {
        content: 'z-[9999] max-h-[min(15rem,var(--reka-select-content-available-height,15rem))] w-(--reka-select-trigger-width) bg-default shadow-lg rounded-md ring ring-default overflow-hidden origin-(--reka-select-content-transform-origin) pointer-events-auto flex flex-col max-h-[min(15rem,var(--reka-combobox-content-available-height,15rem))] origin-(--reka-combobox-content-transform-origin) w-(--reka-combobox-trigger-width)'
      }
    },
    select: {
      slots: {
        content: 'z-[9999] max-h-[min(15rem,var(--reka-select-content-available-height,15rem))] w-(--reka-select-trigger-width) bg-default shadow-lg rounded-md ring ring-default overflow-hidden origin-(--reka-select-content-transform-origin) pointer-events-auto flex flex-col'
      }
    },
    dashboardPanel: {
      slots: {
        root: 'relative flex flex-col min-w-0 min-h-0 flex-1 lg:not-last:border-e lg:not-last:border-default'
      }
    },
    modal: {
      slots: {
        content: 'bg-default divide-y divide-default flex flex-col focus:outline-none w-[calc(100vw-2rem)] max-w-2xl',
        body: 'flex-1 min-h-0 overflow-y-auto p-4 sm:p-6',
        footer: 'shrink-0 flex items-center gap-1.5 p-4 sm:px-6 border-t border-default'
      }
    }
  }
})
