Rails.application.routes.draw do
  resources :dashboard, :only => [:index] do
    collection do
      get :export
    end
  end
end