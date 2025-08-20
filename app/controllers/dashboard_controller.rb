class DashboardController < ApplicationController  
  before_action :find_optional_project
  before_action :authorize_global, :except => [:index, :export]
  
  def index
    if request.format.json? || User.current.allowed_to?(:view_dashboard, nil, global: true)
      @current_project = @project
      @projects = Project.visible.order(:name)
      builder = DashboardDataBuilder.new(@project)
      @statistics = builder.statistics

      respond_to do |format|
        format.html
        format.json { render json: builder.dashboard_data }
      end
    else
      @news = News.latest User.current
      respond_to do |format|
        format.html { render template: 'welcome/index' }
        format.json { render json: { status: 401, message: 'You are not authorized to view the dashboard'} }
      end
    end
  end

  def export
    builder = DashboardExportBuilder.new(@project)
    @statistics = builder.statistics
    @export_data = builder.export_data
    
    respond_to do |format|
      format.pdf do
        pdf_content = DashboardPdfService.new(@export_data, @project, current_language).generate
        send_data pdf_content,
                type: 'application/pdf',
                filename: "dashboard_#{@project&.identifier || 'all'}_#{Time.now.to_i}.pdf"
      end
      format.csv do
        csv_data = DashboardCsvService.new(@statistics, @project).generate
        send_data csv_data,
                filename: "dashboard_#{@project&.identifier || 'all'}_#{Time.now.to_i}.csv",
                type: 'text/csv',
                disposition: 'attachment'
      end
      format.xlsx do
        xls_content = DashboardXlsxService.new(@export_data, @project).generate
        send_data xls_content,
                  type: Mime[:xlsx].to_s,
                  filename: "dashboard_#{@project&.identifier || 'all'}_#{Time.now.to_i}.xlsx",
                  disposition: 'attachment'
      end
      
      format.json do
        render json: @export_data
      end
    end
  end
  
  private
  
  def find_optional_project
    @project = params[:project_id].present? ? Project.find(params[:project_id]) : nil
  end
end