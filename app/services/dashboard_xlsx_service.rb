# frozen_string_literal: true

require 'rubyXL'
require 'rubyXL/convenience_methods'

class DashboardXlsxService
  def initialize(export_data, project = nil)
    @export_data = export_data
    @project = project
  end

  def generate
    workbook = RubyXL::Workbook.new
    sheet = workbook[0]
    sheet.sheet_name = "Dashboard Report"

    row = 0

    # --- Dashboard Header ---
    sheet.add_cell(row, 0, "Dashboard Report")
    sheet.add_cell(row, 1, @project&.name || "All Projects")
    sheet.add_cell(row, 2, Date.current.strftime('%Y-%m-%d'))

    # Bold header
    sheet[row][0].change_font_bold(true)
    sheet[row][1].change_font_bold(true)
    sheet[row][2].change_font_bold(true)

    row += 2

    # --- Summary Statistics ---
    sheet.add_cell(row, 0, "Summary Statistics")
    sheet.merge_cells(row, 0, row, 2) # merge across 3 columns
    sheet[row][0].change_font_bold(true)
    row += 1

    sheet.add_cell(row, 0, "Metric")
    sheet.add_cell(row, 1, "Value")
    sheet[row][0].change_font_bold(true)
    sheet[row][1].change_font_bold(true)
    row += 1

    summary = @export_data[:summary] || {}
    summary_rows = [
      ["Total Issues", summary[:total_issues] || 0],
      ["Open Issues", summary[:open_issues] || 0],
      ["Closed Issues", summary[:closed_issues] || 0],
      ["Completion Rate", summary[:completion_rate] ? "#{summary[:completion_rate].round(2)}%" : "0%"],
      ["Total Time Logged", summary[:total_time] ? "#{summary[:total_time]}h" : "0.0h"],
      ["Active Users", summary[:active_users] || 0]
    ]

    summary_rows.each do |metric, value|
      sheet.add_cell(row, 0, metric)
      sheet.add_cell(row, 1, value)
      row += 1
    end

    row += 1

    # --- Issues by Status ---
    sheet.add_cell(row, 0, "Issues by Status")
    sheet.merge_cells(row, 0, row, 2)
    sheet[row][0].change_font_bold(true)
    row += 1

    sheet.add_cell(row, 0, "Status")
    sheet.add_cell(row, 1, "Count")
    sheet[row][0].change_font_bold(true)
    sheet[row][1].change_font_bold(true)
    row += 1

    @export_data[:charts][:issues_by_status]&.each do |status, count|
      sheet.add_cell(row, 0, status)
      sheet.add_cell(row, 1, count)
      row += 1
    end

    row += 1

    # --- Time by Activity ---
    sheet.add_cell(row, 0, "Time by Activity")
    sheet.merge_cells(row, 0, row, 2)
    sheet[row][0].change_font_bold(true)
    row += 1

    sheet.add_cell(row, 0, "Activity")
    sheet.add_cell(row, 1, "Hours")
    sheet[row][0].change_font_bold(true)
    sheet[row][1].change_font_bold(true)
    row += 1

    @export_data[:charts][:time_by_activity]&.each do |activity, hours|
      sheet.add_cell(row, 0, activity)
      sheet.add_cell(row, 1, hours)
      row += 1
    end

    # --- Return XLSX binary ---
    temp_file = Tempfile.new(["dashboard", ".xlsx"])
    workbook.write(temp_file.path)
    content = File.binread(temp_file.path)
    temp_file.close!
    content
  end
end