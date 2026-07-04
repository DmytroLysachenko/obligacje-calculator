type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function buildNotebookWorkspaceActionLabels(t: TranslateFn) {
  return {
    myFirstPortfolio: t('notebook.my_first_portfolio'),
    defaultDescription: t('notebook.default_description'),
    demoName: t('notebook.demo_name'),
    demoDescription: t('notebook.demo_description'),
    createdSuccess: t('notebook.created_success'),
    demoLoadedSuccess: t('notebook.demo_loaded_success'),
    importCompleted: (count: string) => t('notebook.import_completed_added_lots', { count }),
    importFailed: t('notebook.import_failed'),
    deleteSuccess: t('notebook.delete_success'),
    deleteFailed: t('notebook.delete_failed'),
    storageUnavailable: t('notebook.storage_unavailable'),
    createError: t('notebook.create_error'),
  };
}

export function buildNotebookPortfolioListLabels(t: TranslateFn) {
  return {
    title: t('notebook.stored_portfolios'),
    description: t('notebook.stored_portfolios_desc'),
    note: t('notebook.stored_portfolios_note'),
    created: t('common.created'),
    usage: t('notebook.usage_label'),
    usageDescription: t('notebook.usage_desc'),
    statusPublic: t('notebook.status_public'),
    statusPrivate: t('notebook.status_private'),
    fallbackDescription: t('notebook.portfolio_details'),
    openPortfolio: t('notebook.open_portfolio'),
    signInRequired: t('workspace.sign_in_required_short'),
  };
}

export function buildNotebookFeedbackLabels(t: TranslateFn) {
  return {
    deletePortfolio: t('notebook.delete_portfolio'),
    confirmDeletePortfolio: (name: string) =>
      t('notebook.confirm_delete_portfolio_short', {
        name,
      }),
    delete: t('common.delete'),
    cancel: t('common.cancel'),
  };
}
