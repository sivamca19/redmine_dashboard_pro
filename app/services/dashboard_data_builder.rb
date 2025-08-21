class DashboardDataBuilder
  def initialize(project)
    @project = project
    @statistics = DashboardStatistics.new(@project)
  end

  def statistics
    @statistics
  end
  
  def dashboard_data
    {
      project: @project&.name || 'All Projects',
      project_id: @project&.id,
      overview: {
        total_projects: @statistics.total_projects,
        total_issues: @statistics.total_issues,
        total_users: @statistics.total_users,
        total_time: @statistics.total_time_spent,
        open_issues: @statistics.open_issues,
        closed_issues: @statistics.closed_issues
      },
      time_spent_this_week: @statistics.time_spent_this_week,
      time_spent_this_month: @statistics.time_spent_this_month,
      issues: {
        by_status: @statistics.issues_by_status,
        by_priority: @statistics.issues_by_priority,
        by_tracker: @statistics.issues_by_tracker,
        recent: @statistics.recent_issues(5)
      },
      time_tracking: {
        this_week: @statistics.time_spent_this_week,
        this_month: @statistics.time_spent_this_month,
        by_activity: @statistics.time_by_activity
      },
      activity: {
        recent: @statistics.recent_activities(10),
        active_users: @statistics.active_users
      },
      project_progress: (@project ? @statistics.project_progress : nil),
      issuesByStatus: @statistics.issues_by_status,
      issuesByPriority: @statistics.issues_by_priority,
      timeByActivity: @statistics.time_by_activity,
      timeByUser: @statistics.time_by_user,
      dailyTime: @statistics.daily_time_last_30_days,
      issuesByTracker: @statistics.issues_by_tracker,
      apiKey: User.current.api_key
    }
  end
end