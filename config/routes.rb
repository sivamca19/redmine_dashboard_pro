Rails.application.routes.draw do
  get 'dashboard/export', to: 'dashboard#export', as: 'dashboard_export'
  resources :dashboard, only: [:index]
end