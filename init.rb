Redmine::Plugin.register :redmine_dashboard_pro do
  name 'Redmine Dashboard Pro plugin'
  author 'Sivamanikandan'
  description 'Comprehensive dashboard with insights and analytics for Redmine'
  version '0.0.1'
  url 'https://github.com/sivamca19/redmine_dashboard_pro'
  author_url 'https://github.com/sivamca19'

  # Register XLSX MIME type
  Mime::Type.register "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", :xlsx

  # menu :top_menu, :dashboard, { :controller => 'dashboard', :action => 'index' },
  #   :caption => :label_dashboard, :first => true

  menu :project_menu, :dashboard, { :controller => 'dashboard', :action => 'project' },
    :caption => :label_dashboard, :after => :activity, :param => :id

  # Permissions
  project_module :dashboard_module do
    permission :view_dashboard, { :dashboard => [:index] }
  end
end

require_relative 'lib/redmine_dashboard_pro/projects_controller_patch'
require_relative 'lib/redmine_dashboard_pro/welcome_controller_patch'
ProjectsController.send(:include, RedmineDashboardPro::ProjectsControllerPatch) unless ProjectsController.included_modules.include?(RedmineDashboardPro::ProjectsControllerPatch)
WelcomeController.send(:include, RedmineDashboardPro::WelcomeControllerPatch) unless WelcomeController.included_modules.include?(RedmineDashboardPro::WelcomeControllerPatch)