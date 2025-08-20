class DashboardController < ApplicationController  
  before_action :find_optional_project
  before_action :authorize_global, :except => [:index]
  
  helper :issues
  helper :projects
  helper :queries
  helper :sort
  
  def index
    if User.current.allowed_to?(:view_dashboard, nil, global: true)
      @current_project = @project
      @projects = Project.visible.order(:name)
      @statistics = DashboardStatistics.new(@project)
      
      respond_to do |format|
        format.html
        format.json { render json: dashboard_data }
      end
    else
      @news = News.latest User.current
      render template: 'welcome/index'
    end
  end
  
  def project_stats
    @project = Project.find(params[:project_id]) if params[:project_id].present?
    @statistics = DashboardStatistics.new(@project)
    
    render json: {
      project: @project&.name || 'All Projects',
      total_issues: @statistics.total_issues,
      open_issues: @statistics.open_issues,
      closed_issues: @statistics.closed_issues,
      overdue_issues: @statistics.overdue_issues,
      completion_rate: @statistics.completion_rate
    }
  end
  
  def issue_stats
    @project = Project.find(params[:project_id]) if params[:project_id].present?
    @statistics = DashboardStatistics.new(@project)
    
    render json: {
      by_status: @statistics.issues_by_status,
      by_priority: @statistics.issues_by_priority,
      by_tracker: @statistics.issues_by_tracker,
      by_assignee: @statistics.issues_by_assignee,
      recent_issues: @statistics.recent_issues(10)
    }
  end
  
  def time_stats
    @project = Project.find(params[:project_id]) if params[:project_id].present?
    @statistics = DashboardStatistics.new(@project)
    
    render json: {
      total_hours: @statistics.total_time_spent,
      this_month: @statistics.time_spent_this_month,
      by_user: @statistics.time_by_user,
      by_activity: @statistics.time_by_activity,
      daily_time: @statistics.daily_time_last_30_days
    }
  end
  
  def user_activity
    @project = Project.find(params[:project_id]) if params[:project_id].present?
    @statistics = DashboardStatistics.new(@project)
    
    render json: {
      active_users: @statistics.active_users,
      user_contributions: @statistics.user_contributions,
      recent_activities: @statistics.recent_activities(20)
    }
  end

  def api_overview
    @statistics = DashboardStatistics.new(@project)
    
    render json: {
      status: 'success',
      data: {
        project_name: @project&.name || 'All Projects',
        summary: {
          total_projects: @statistics.total_projects,
          total_issues: @statistics.total_issues,
          completion_rate: @statistics.completion_rate,
          active_users: @statistics.active_users,
          total_time: @statistics.total_time_spent
        },
        charts: {
          issues_by_status: @statistics.issues_by_status,
          time_by_activity: @statistics.time_by_activity
        },
        recent_issues: @statistics.recent_issues(5),
        last_updated: Time.current
      }
    }
  end

  def export
    @statistics = DashboardStatistics.new(@project)
    
    respond_to do |format|
      format.pdf do
        render pdf: "dashboard_#{@project&.identifier || 'all'}_#{Date.current}",
              template: 'dashboard/export.pdf.erb',
              layout: 'pdf'
      end
      
      format.csv do
        csv_data = generate_csv_report(@statistics)
        send_data csv_data,
                  filename: "dashboard_#{@project&.identifier || 'all'}_#{Date.current}.csv",
                  type: 'text/csv'
      end
      
      format.json do
        render json: dashboard_data
      end
    end
  end
  
  private
  
  def find_optional_project
    @project = params[:project_id].present? ? Project.find(params[:project_id]) : nil
  end
  
  def dashboard_data
    @statistics = DashboardStatistics.new(@project)
    
    {
      project: @project&.name || 'All Projects',
      project_id: @project&.id,
      overview: {
        total_projects: @statistics.total_projects,
        total_issues: @statistics.total_issues,
        total_users: @statistics.total_users,
        total_time: @statistics.total_time_spent
      },
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
      issuesByStatus: @statistics.issues_by_status,
      issuesByPriority: @statistics.issues_by_priority,
      timeByActivity: @statistics.time_by_activity,
      timeByUser: @statistics.time_by_user,
      dailyTime: @statistics.daily_time_last_30_days
    }
  end

  def generate_csv_report(statistics)
    CSV.generate(headers: true) do |csv|
      csv << ['Metric', 'Value', 'Project', 'Date']
      csv << ['Total Issues', statistics.total_issues, @project&.name || 'All Projects', Date.current]
      csv << ['Open Issues', statistics.open_issues, @project&.name || 'All Projects', Date.current]
      csv << ['Closed Issues', statistics.closed_issues, @project&.name || 'All Projects', Date.current]
      csv << ['Completion Rate', "#{statistics.completion_rate}%", @project&.name || 'All Projects', Date.current]
      csv << ['Total Time Logged', "#{statistics.total_time_spent}h", @project&.name || 'All Projects', Date.current]
      csv << ['Active Users', statistics.active_users, @project&.name || 'All Projects', Date.current]
    end
  end
end