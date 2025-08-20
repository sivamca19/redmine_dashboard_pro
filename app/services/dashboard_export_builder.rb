class DashboardExportBuilder
  def initialize(project)
    @project = project
    @statistics = DashboardStatistics.new(project)
  end

  def statistics
    @statistics
  end

  def export_data
    {
      project: @project&.name || 'All Projects',
      generated_at: Time.current,
      summary: summary_data,
      charts: charts_data,
      recent_data: recent_data
    }
  end

  private

  def summary_data
    {
      total_projects: @statistics.total_projects,
      total_issues: @statistics.total_issues,
      open_issues: @statistics.open_issues,
      closed_issues: @statistics.closed_issues,
      completion_rate: @statistics.completion_rate,
      total_users: @statistics.total_users,
      active_users: @statistics.active_users,
      total_time: @statistics.total_time_spent,
      overdue_issues: @statistics.overdue_issues
    }
  end

  def charts_data
    {
      issues_by_status: @statistics.issues_by_status,
      issues_by_priority: @statistics.issues_by_priority,
      issues_by_tracker: @statistics.issues_by_tracker,
      time_by_activity: @statistics.time_by_activity,
      time_by_user: @statistics.time_by_user.first(10),
      daily_time: @statistics.daily_time_last_30_days
    }
  end

  def recent_data
    {
      recent_issues: @statistics.recent_issues(10),
      recent_activities: @statistics.recent_activities(15)
    }
  end
end