module DashboardHelper
  def dashboard_widget(title, &block)
    content = capture(&block)
    content_tag :div, class: 'dashboard-widget' do
      content_tag(:h3, title, class: 'widget-title') + 
      content_tag(:div, content, class: 'widget-content')
    end
  end
  
  def progress_bar(percentage, options = {})
    css_class = "progress-bar #{options[:class]}"
    color_class = case percentage
                  when 0..30 then 'low'
                  when 31..70 then 'medium'
                  else 'high'
                  end
    
    content_tag :div, class: "progress #{color_class}" do
      content_tag :div, "#{percentage}%", 
                  class: css_class, 
                  style: "width: #{percentage}%"
    end
  end
  
  def status_badge(status, count = nil)
    css_class = case status.downcase
                when /new|open/ then 'badge-open'
                when /closed|resolved/ then 'badge-closed'
                when /in progress|assigned/ then 'badge-progress'
                else 'badge-default'
                end
    
    text = count ? "#{status} (#{count})" : status
    content_tag :span, text, class: "badge #{css_class}"
  end
  
  def priority_icon(priority)
    icon_class = case priority.downcase
                 when /low/ then 'icon-priority-lowest'
                 when /normal/ then 'icon-priority-normal'
                 when /high/ then 'icon-priority-high'
                 when /urgent|immediate/ then 'icon-priority-highest'
                 else 'icon-priority-normal'
                 end
    
    content_tag :i, '', class: icon_class
  end
  
  def format_time_duration(hours)
    if hours < 1
      "#{(hours * 60).round}m"
    elsif hours < 8
      "#{hours.round(1)}h"
    else
      days = (hours / 8).floor
      remaining_hours = (hours % 8).round(1)
      "#{days}d #{remaining_hours}h"
    end
  end
  
  def chart_data_to_json(data)
    data.to_json.html_safe
  end
end