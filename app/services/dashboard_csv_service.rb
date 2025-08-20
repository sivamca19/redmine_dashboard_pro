require 'csv'

class DashboardCsvService
  def initialize(statistics, project = nil)
    @statistics = statistics
    @project = project
  end

  def generate
    CSV.generate(headers: true) do |csv|
      # --- Header ---
      csv << ['Dashboard Report', @project&.name || 'All Projects', Date.current.to_s]
      csv << []

      # --- Summary Statistics ---
      csv << ['Summary Statistics']
      csv << ['Metric', 'Value']
      csv << ['Total Issues', @statistics.total_issues]
      csv << ['Open Issues', @statistics.open_issues]
      csv << ['Closed Issues', @statistics.closed_issues]
      csv << ['Completion Rate', "#{@statistics.completion_rate}%"]
      csv << ['Total Time Logged', "#{@statistics.total_time_spent.round(2)}h"]
      csv << ['Active Users', @statistics.active_users]
      csv << []

      # --- Issues by Status ---
      csv << ['Issues by Status']
      csv << ['Status', 'Count']
      @statistics.issues_by_status.each do |status, count|
        csv << [status, count]
      end
      csv << []

      # --- Time by Activity ---
      csv << ['Time by Activity']
      csv << ['Activity', 'Hours']
      @statistics.time_by_activity.each do |activity, hours|
        csv << [activity, hours.round(2)]
      end
    end
  end
end
