module RedmineDashboardPro
  module ProjectsControllerPatch
    def self.included(base)
      base.class_eval do
        helper :dashboard
        alias_method :original_show, :show
        def show
          if @project.module_enabled?(:dashboard)
            @current_project = @project
            @principals_by_role = @project.principals_by_role
            with_subprojects = Setting.display_subprojects_issues?
            @trackers = @project.rolled_up_trackers(with_subprojects).visible
            cond = @project.project_condition(with_subprojects)
            @open_issues_by_tracker = Issue.visible.open.where(cond).group(:tracker).count
            @total_issues_by_tracker = Issue.visible.where(cond).group(:tracker).count
            @projects = Project.visible.order(:name)
            builder = DashboardDataBuilder.new(@project)
            @statistics = builder.statistics
            render 'dashboard/project'
          else
            original_show
          end
        end
      end
    end
  end
end
