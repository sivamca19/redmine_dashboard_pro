Redmine::Plugin.register :redmine_dashboard_pro do
  name 'Redmine Dashboard Pro plugin'
  author 'Sivamanikandan'
  description 'Comprehensive dashboard with insights and analytics for Redmine'
  version '0.0.1'
  url 'http://example.com/path/to/plugin'
  author_url 'http://example.com/about'

  # Add dashboard to top menu
  menu :top_menu, :dashboard, { :controller => 'dashboard', :action => 'index' }, 
       :caption => :label_dashboard, :first => true

  # Permissions
  project_module :dashboard_module do
    permission :view_dashboard, { :dashboard => [:index] }
  end
end
