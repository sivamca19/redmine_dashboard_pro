# Plugin's routes
# See: http://guides.rubyonrails.org/routing.html
Rails.application.routes.draw do
  resources :dashboard, :only => [:index] do
    collection do
      get :project_stats
      get :issue_stats
      get :time_stats
      get :user_activity
      get :switch_project
    end
  end
  # root :to => 'dashboard#index'
end