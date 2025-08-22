Rails.application.routes.draw do
  root to: 'dashboard#index'
  get 'dashboard/export', to: 'dashboard#export', as: 'dashboard_export'
  resources :dashboard, only: [:index]
end