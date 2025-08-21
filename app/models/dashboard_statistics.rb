class DashboardStatistics
  attr_reader :project
  
  def initialize(project = nil)
    @project = project
    @scope = project ? project : Project.visible
  end
  
  def total_projects
    return 1 if @project
    Project.visible.count
  end
  
  def total_issues
    issues_scope.count
  end
  
  def open_issues
    issues_scope.open.count
  end
  
  def closed_issues
    issues_scope.closed.count
  end
  
  def overdue_issues
    issues_scope.open.where('due_date < ?', Date.current).count
  end
  
  def completion_rate
    return 0 if total_issues == 0
    ((closed_issues.to_f / total_issues) * 100).round(2)
  end
  
  def issues_by_status
    issues_scope.joins(:status)
                .group('issue_statuses.name')
                .count
  end
  
  def issues_by_priority
    issues_scope.joins(:priority)
                .group('enumerations.name')
                .count
  end
  
  def issues_by_tracker
    issues_scope.joins(:tracker)
                .group('trackers.name')
                .count
  end
  
  def issues_by_assignee
    issues_scope.joins(:assigned_to)
                .group('users.firstname', 'users.lastname')
                .count
                .map { |k, v| ["#{k[0]} #{k[1]}", v] }
                .to_h
  end
  
  def recent_issues(limit = 10)
    issues_scope.includes(:status, :priority, :tracker, :assigned_to)
                .order(created_on: :desc)
                .limit(limit)
                .map do |issue|
      {
        id: issue.id,
        subject: issue.subject,
        status: issue.status.name,
        priority: issue.priority.name,
        tracker: issue.tracker.name,
        assignee: issue.assigned_to&.name,
        created_on: issue.created_on,
        updated_on: issue.updated_on
      }
    end
  end
  
  def total_users
    if @project.present?
      @project.users.active.count
    else
      User.active.count
    end
  end
  
  def total_time_spent
    time_entries_scope.sum(:hours)
  end
  
  def time_spent_this_week
    time_entries_scope.where('spent_on >= ?', Date.current.beginning_of_week)
                      .sum(:hours)
  end
  
  def time_spent_this_month
    time_entries_scope.where('spent_on >= ?', Date.current.beginning_of_month)
                      .sum(:hours)
  end
  
  def time_by_user
    time_entries_scope.joins(:user)
                      .group('users.firstname', 'users.lastname')
                      .sum(:hours)
                      .map { |k, v| ["#{k[0]} #{k[1]}", v.round(2)] }
                      .to_h
  end
  
  def time_by_activity
    time_entries_scope.joins(:activity)
                      .group('enumerations.name')
                      .sum(:hours)
                      .map { |k, v| [k, v.round(2)] }
                      .to_h
  end
  
  def daily_time_last_30_days
    start_date = 30.days.ago.to_date
    end_date = Date.current
    
    (start_date..end_date).map do |date|
      hours = time_entries_scope.where(spent_on: date).sum(:hours)
      [date.strftime('%Y-%m-%d'), hours.round(2)]
    end.to_h
  end
  
  def active_users(days = 30)
    TimeEntry
      .where(spent_on: days.days.ago..Date.current)
      .joins(:user)
      .select(:user_id)
      .distinct
      .count
  end
  
  def user_contributions
    contributions = {}
    
    # Issues created
    issues_created = issues_scope.joins(:author)
                                .group('users.firstname', 'users.lastname')
                                .count
    
    # Time logged
    time_logged = time_entries_scope.joins(:user)
                                   .group('users.firstname', 'users.lastname')
                                   .sum(:hours)
    
    # Combine contributions
    all_users = (issues_created.keys + time_logged.keys).uniq
    
    all_users.map do |user_key|
      user_name = "#{user_key[0]} #{user_key[1]}"
      {
        name: user_name,
        issues_created: issues_created[user_key] || 0,
        time_logged: (time_logged[user_key] || 0).round(2)
      }
    end.sort_by { |u| -(u[:issues_created] + u[:time_logged]) }
  end
  
  def recent_activities(limit = 20)
    activities = []
    
    # Recent issues
    recent_issues = issues_scope.includes(:author, :status)
                               .order(updated_on: :desc)
                               .limit(limit / 2)
    
    recent_issues.each do |issue|
      activities << {
        type: 'issue',
        description: "Issue ##{issue.id}: #{issue.subject}",
        user: issue.author.name,
        date: issue.updated_on,
        status: issue.status.name
      }
    end
    
    # Recent time entries
    recent_time = time_entries_scope.includes(:user, :issue)
                                   .order(spent_on: :desc)
                                   .limit(limit / 2)
    
    recent_time.each do |entry|
      activities << {
        type: 'time_entry',
        description: "#{entry.hours}h logged on #{entry.issue ? "##{entry.issue.id}" : 'project'}",
        user: entry.user.name,
        date: entry.spent_on.to_time,
        hours: entry.hours
      }
    end
    
    activities.sort_by { |a| -a[:date].to_i }.first(limit)
  end
  
  def project_progress
    return {} unless @project
    
    total = @project.issues.count
    closed = @project.issues.closed.count
    
    {
      total_issues: total,
      closed_issues: closed,
      progress_percentage: total > 0 ? ((closed.to_f / total) * 100).round(2) : 0,
      estimated_hours: @project.time_entries.sum(:hours),
      remaining_hours: calculate_remaining_hours
    }
  end
  
  private
  
  def issues_scope
    if @project
      @project.issues
    else
      Issue.visible
    end
  end
  
  def time_entries_scope
    if @project
      @project.time_entries
    else
      TimeEntry.visible
    end
  end
  
  def calculate_remaining_hours
    return 0 unless @project
    
    estimated = @project.issues.sum(:estimated_hours) || 0
    logged = @project.time_entries.sum(:hours) || 0
    [estimated - logged, 0].max
  end
end