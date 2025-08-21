var Dashboard = {
  charts: {},
  
  init: function(data) {
    this.data = data;
    this.initCharts();
    console.log('Dashboard initialized for:', data.project || 'All Projects');
  },

  initCharts: function() {
    this.createIssueStatusChart();
    this.createTimeTrackingChart();
    this.createUserActivityChart();
    this.createIssueDistributionChart();
    this.updateProjectProgress(this.data)
  },
  
  createIssueStatusChart: function() {
    var ctx = document.getElementById('issueStatusChart');
    if (!ctx) return;

    if (this.charts.issueStatus) {
      this.charts.issueStatus.destroy();
    }
    
    var data = this.data.issuesByStatus || {};
    var labels = Object.keys(data);
    var values = Object.values(data);
    var colors = this.generateColors(labels.length);
    
    this.charts.issueStatus = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  },
  
  createTimeTrackingChart: function() {
    var ctx = document.getElementById('timeTrackingChart');
    if (!ctx) return;

    if (this.charts.timeTracking) {
      this.charts.timeTracking.destroy();
    }
    
    var dailyData = this.data.dailyTime || {};
    var labels = Object.keys(dailyData).slice(-14); // Last 14 days
    var values = labels.map(function(date) { return dailyData[date] || 0; });
    
    this.charts.timeTracking = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.map(function(date) { 
          return new Date(date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}); 
        }),
        datasets: [{
          label: 'Hours Logged',
          data: values,
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  },
  
  createUserActivityChart: function() {
    var ctx = document.getElementById('userActivityChart');
    if (!ctx) return;

    if (this.charts.userActivity) {
      this.charts.userActivity.destroy();
    }
    
    var data = this.data.timeByUser || {};
    var labels = Object.keys(data).slice(0, 8); // Top 8 users
    var values = labels.map(function(user) { return data[user] || 0; });
    
    this.charts.userActivity = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Hours Logged',
          data: values,
          backgroundColor: '#2ecc71',
          borderColor: '#27ae60',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              maxRotation: 45
            }
          },
          y: {
            beginAtZero: true
          }
        }
      }
    });
  },
  
  createIssueDistributionChart: function() {
    var ctx = document.getElementById('issueDistributionChart');
    if (!ctx) return;

    if (this.charts.issueDistribution) {
      this.charts.issueDistribution.destroy();
    }
    
    var data = this.data.issuesByTracker || {};
    var labels = Object.keys(data);
    var values = Object.values(data);
    var colors = this.generateColors(labels.length);
    
    this.charts.issueDistribution = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
  },
  
  generateColors: function(count) {
    var colors = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12', 
      '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
    ];
    
    var result = [];
    for (var i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  },
  
  switchProject: function(projectId) {
    var url = '/dashboard';
    var params = '';
    if (projectId && projectId !== '') {
      params = '?project_id=' + projectId;
    }
    
    this.showLoading();
    // First, let's try the JSON endpoint
    $.ajax({
      url: url + '.json' + params,
      type: 'GET',
      dataType: 'json',
      headers: {
        'Accept': 'application/json',
        'X-Redmine-API-Key': this.data.apiKey
      },
      success: (data) => {
        console.log("Received data:", data);
        this.handleSuccessfulDataLoad(data, params, url);
      },
      error: (xhr, status, error) => {
        console.warn('JSON endpoint failed, trying HTML endpoint:', error);
        // Fallback to HTML endpoint and parse
        window.location.replace(url + params);
      }
    });
  },

  handleSuccessfulDataLoad: function(data, params, url) {
    this.data = data;
    this.updateDashboard(data);
    this.updateCharts(data);
    this.updateProjectProgress(data);
    this.hideLoading();
    // Update URL without page refresh
    window.history.pushState({}, '', url + params);
  },
  
  updateDashboard: function(data) {
    // Update overview cards
    var overview = data.overview || {};
    this.updateElementText('total-projects', overview.total_projects || 0);
    this.updateElementText('total-issues', overview.total_issues || 0);
    this.updateElementText('total-users', overview.total_users || 0);
    this.updateElementText('total-time', this.formatTimeDuration(overview.total_time || 0));
    // Update issue statistics in the Issues Overview widget
    this.updateIssueStatistics(data);
    // Update time statistics
    this.updateTimeStatistics(data);
    // Update active users
    var activity = data.activity || {};
    this.updateElementText('active-users', activity.active_users || 0);
    // Update recent issues
    this.updateRecentIssues((data.issues && data.issues.recent) || []);
    // Update activity feed
    this.updateActivityFeed((activity && activity.recent) || []);
  },

  updateElementText: function(id, value) {
    var element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  },

  updateIssueStatistics: function(data) {
    // Update the stat bars in Issues Overview widget
    var overview = data.overview || {};
    var openIssues = overview.open_issues || 0;
    var closedIssues = overview.closed_issues || 0;
    var totalIssues = overview.total_issues || 0;
    // Update open issues stat bar
    var openStatBar = document.querySelector('.stat-bar.open');
    if (openStatBar) {
      var openSpan = openStatBar.querySelector('span');
      var openBar = openStatBar.querySelector('.bar');
      if (openSpan) openSpan.textContent = 'Open: ' + openIssues;
      if (openBar && totalIssues > 0) {
        var openPercentage = (openIssues / totalIssues * 100).toFixed(0);
        openBar.style.width = openPercentage + '%';
      } else if (openBar) {
        openBar.style.width = '0%';
      }
    }

    // Update closed issues stat bar
    var closedStatBar = document.querySelector('.stat-bar.closed');
    if (closedStatBar) {
      var closedSpan = closedStatBar.querySelector('span');
      var closedBar = closedStatBar.querySelector('.bar');
      if (closedSpan) closedSpan.textContent = 'Closed: ' + closedIssues;
      if (closedBar && totalIssues > 0) {
        var closedPercentage = (closedIssues / totalIssues * 100).toFixed(0);
        closedBar.style.width = closedPercentage + '%';
      } else if (closedBar) {
        closedBar.style.width = '0%';
      }
    }

    // Update completion rate progress bar
    var completionRate = totalIssues > 0 ? (closedIssues / totalIssues * 100) : 0;
    var progressBar = document.querySelector('.completion-rate .progress-bar');
    if (progressBar) {
      progressBar.style.width = completionRate.toFixed(0) + '%';
      progressBar.textContent = completionRate.toFixed(0) + '%';

      // Update progress bar color based on completion rate
      var progressContainer = progressBar.parentElement;
      if (progressContainer) {
        progressContainer.className = 'progress ' + (completionRate >= 75 ? 'high' : (completionRate >= 50 ? 'medium' : 'low'));
      }
    }
  },

  updateTimeStatistics: function(data) {
    // Update time statistics in the Time Tracking widget
    var timeThisWeek = data.time_spent_this_week || data.overview?.time_spent_this_week || 0;
    var timeThisMonth = data.time_spent_this_month || data.overview?.time_spent_this_month || 0;

    // Find and update the time stats
    var timeStats = document.querySelector('.time-stats');
    if (timeStats) {
      var weekStat = timeStats.querySelector('p:first-child strong + span') ||
                    timeStats.querySelector('p:first-child').lastChild;
      var monthStat = timeStats.querySelector('p:last-child strong + span') ||
                     timeStats.querySelector('p:last-child').lastChild;

      if (weekStat) {
        if (weekStat.nodeType === Node.TEXT_NODE) {
          weekStat.textContent = this.formatTimeDuration(timeThisWeek);
        } else {
          weekStat.textContent = this.formatTimeDuration(timeThisWeek);
        }
      }

      if (monthStat) {
        if (monthStat.nodeType === Node.TEXT_NODE) {
          monthStat.textContent = this.formatTimeDuration(timeThisMonth);
        } else {
          monthStat.textContent = this.formatTimeDuration(timeThisMonth);
        }
      }

      // If the above doesn't work, try updating the entire paragraph content
      var weekParagraph = timeStats.querySelector('p:first-child');
      var monthParagraph = timeStats.querySelector('p:last-child');

      if (weekParagraph) {
        weekParagraph.innerHTML = '<strong>This Week:</strong> <span>' + this.formatTimeDuration(timeThisWeek) + '</span>';
      }

      if (monthParagraph) {
        monthParagraph.innerHTML = '<strong>This Month:</strong> <span>' + this.formatTimeDuration(timeThisMonth) + '</span>';
      }
    }
  },

  updateProjectProgress: function(data) {
    var projectProgressWidget = document.querySelector('.project-progress-widget');
    var dashboardGrid = document.querySelector('.dashboard-grid');

    if (!dashboardGrid) return;

    // Remove existing project progress widget
    if (projectProgressWidget) {
      projectProgressWidget.remove();
    }
    // Add project progress widget if we have project data
    if (data.project_progress && data.project_progress.total_issues !== undefined) {
      var progressWidget = this.createProjectProgressWidget(data.project_progress, data.project || 'Project');

      // Insert after the first widget (Issues Overview)
      var issuesWidget = dashboardGrid.querySelector('.widget:first-child');
      if (issuesWidget && issuesWidget.nextSibling) {
        dashboardGrid.insertBefore(progressWidget, issuesWidget.nextSibling);
      } else if (issuesWidget) {
        issuesWidget.insertAdjacentElement('afterend', progressWidget);
      } else {
        dashboardGrid.appendChild(progressWidget);
      }
    }

    // Recalculate grid layout with proper balancing
    this.recalculateGridLayout();
  },

  createProjectProgressWidget: function(progress, projectName) {
    var widget = document.createElement('div');
    widget.className = 'widget large project-progress-widget';

    var progressPercentage = progress.progress_percentage || 0;
    var progressClass = progressPercentage >= 75 ? 'high' :
                       progressPercentage >= 50 ? 'medium' : 'low';

    widget.innerHTML = `
      <h3>${projectName} Progress</h3>
      <div class="widget-content">
        <div class="progress-overview">
          <p><strong>Total Issues:</strong> <span>${progress.total_issues || 0}</span></p>
          <p><strong>Closed:</strong> <span>${progress.closed_issues || 0}</span></p>
          <div class="progress ${progressClass}">
            <div class="progress-bar" style="width: ${progressPercentage}%">
              ${Math.round(progressPercentage, 2)}%
            </div>
          </div>
          <p><strong>Time Logged:</strong> <span>${this.formatTimeDuration(progress.estimated_hours || 0)}</span></p>
        </div>
      </div>
    `;

    return widget;
  },

  recalculateGridLayout: function() {
    var grid = document.querySelector('.dashboard-grid');
    if (!grid) return;

    var widgets = Array.from(grid.querySelectorAll('.widget'));
    var hasProjectProgress = grid.querySelector('.project-progress-widget') !== null;
    var screenWidth = window.innerWidth;

    // Remove any existing grid layout classes
    grid.classList.remove('has-project-progress', 'balanced-layout');

    // Reset all widget styles
    widgets.forEach(function(widget) {
      widget.style.gridColumn = '';
      widget.style.order = '';
    });

    if (hasProjectProgress) {
      grid.classList.add('has-project-progress');

      // Apply balanced layout based on screen size
      if (screenWidth > 1200) {
        // Large screens: 3-column layout with better distribution
        this.applyLargeScreenLayout(widgets);
      } else if (screenWidth > 800) {
        // Medium screens: 2-column layout
        this.applyMediumScreenLayout(widgets);
      }
      // Small screens: single column (default)
    }

    // Force reflow
    grid.style.display = 'none';
    grid.offsetHeight; // Trigger reflow
    grid.style.display = 'grid';

    // Add balanced layout class for CSS
    grid.classList.add('balanced-layout');
  },

  applyLargeScreenLayout: function(widgets) {
    // For 3-column layout, distribute widgets evenly
    var totalWidgets = widgets.length;
    widgets.forEach(function(widget, index) {
      // Reset order first
      widget.style.order = '';

      // Apply specific layouts based on total widget count
      if (totalWidgets === 6) {
        // Perfect 2x3 grid - each widget spans 1 column
        widget.style.gridColumn = 'span 1';
      } else if (totalWidgets === 7) {
        // 7 widgets: First row has 3, second row has 3, third row has 1 centered
        if (index < 3) {
          widget.style.gridColumn = 'span 1'; // First row
        } else if (index < 6) {
          widget.style.gridColumn = 'span 1'; // Second row
        } else {
          widget.style.gridColumn = 'span 3'; // Center the last widget
        }
      } else if (totalWidgets === 8) {
        // 8 widgets: Try to balance as 3-3-2
        if (index < 3) {
          widget.style.gridColumn = 'span 1'; // First row
        } else if (index < 6) {
          widget.style.gridColumn = 'span 1'; // Second row
        } else {
          // Last two widgets - make them span to fill the row nicely
          widget.style.gridColumn = 'span 1';
        }
      } else {
        // Default: single column span
        widget.style.gridColumn = 'span 1';
      }
    });
  },

  applyMediumScreenLayout: function(widgets) {
    // For 2-column layout
    widgets.forEach(function(widget, index) {
      widget.style.gridColumn = 'span 1';
    });
  },
  
  updateRecentIssues: function(issues) {
    var container = document.getElementById('recent-issues');
    if (!container) return;
    
    container.innerHTML = '';
    if (!issues || issues.length === 0) {
      container.innerHTML = '<div class="no-data">No recent issues found</div>';
      return;
    }

    issues.forEach(function(issue) {
      var issueEl = document.createElement('div');
      issueEl.className = 'issue-item';
      var status = issue.status || 'unknown';
      var badgeClass = 'badge-' + status.toLowerCase().replace(/\s+/g, '-');
      issueEl.innerHTML = `
        <div class="issue-header">
          <a href="/issues/${issue.id}" class="issue-link">#${issue.id}</a>
          <span class="badge ${badgeClass}">${status}</span>
        </div>
        <div class="issue-subject">${(issue.subject || '').substring(0, 60)}${issue.subject && issue.subject.length > 60 ? '...' : ''}</div>
        <div class="issue-meta">
          <span class="assignee">${issue.assignee || 'Unassigned'}</span>
          <span class="date">${Dashboard.timeAgo(issue.updated_on)} ago</span>
        </div>
      `;
      container.appendChild(issueEl);
    });
  },
  
  updateActivityFeed: function(activities) {
    var container = document.getElementById('activity-feed');
    if (!container) return;
    container.innerHTML = '';
    if (!activities || activities.length === 0) {
      container.innerHTML = '<div class="no-data">No recent activity found</div>';
      return;
    }
    activities.forEach(function(activity) {
      var activityEl = document.createElement('div');
      activityEl.className = `activity-item ${activity.type || 'default'}`;
      activityEl.innerHTML = `
        <div class="activity-icon">
          <i class="icon-${activity.type || 'default'}"></i>
        </div>
        <div class="activity-content">
          <div class="activity-description">${activity.description || ''}</div>
          <div class="activity-meta">
            <span class="user">${activity.user || 'Unknown'}</span>
            <span class="date">${Dashboard.timeAgo(activity.date)} ago</span>
          </div>
        </div>
      `;
      container.appendChild(activityEl);
    });
  },
  
  updateCharts: function(data) {
    // Destroy existing charts before creating new ones
    Object.keys(this.charts).forEach(key => {
      if (this.charts[key]) {
        this.charts[key].destroy();
        delete this.charts[key];
      }
    });
    // Update data and recreate charts with new data
    this.data = data;
    this.initCharts();
  },
  
  bindEvents: function() {
    // Auto-refresh every 5 minutes
    setInterval(() => {
      this.refreshData();
    }, 300000);
    
    // Bind refresh button if exists
    var refreshBtn = document.getElementById('refresh-dashboard');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refreshData();
      });
    }
    // Bind window resize to recalculate grid
    window.addEventListener('resize', () => {
      setTimeout(() => {
        this.recalculateGridLayout();
      }, 100);
    });
  },
  
  refreshData: function() {
    var currentProjectId = this.data.projectId || '';
    this.switchProject(currentProjectId);
  },
  
  showLoading: function() {
    // Remove existing loader if any
    this.hideLoading();
    var loader = document.createElement('div');
    loader.id = 'dashboard-loader';
    loader.className = 'dashboard-loader';
    loader.innerHTML = '<div class="spinner"></div><span>Loading...</span>';
    document.body.appendChild(loader);
  },
  
  hideLoading: function() {
    var loader = document.getElementById('dashboard-loader');
    if (loader) {
      loader.remove();
    }
  },

  showError: function(message) {
    // Remove existing error if any
    var existingError = document.getElementById('dashboard-error');
    if (existingError) {
      existingError.remove();
    }
    var error = document.createElement('div');
    error.id = 'dashboard-error';
    error.className = 'dashboard-error';
    error.innerHTML = `
      <div class="error-content">
        <strong>Error:</strong> ${message}
        <button onclick="this.parentElement.parentElement.remove()" class="error-close">×</button>
      </div>
    `;
    var container = document.querySelector('.dashboard-container');
    if (container) {
      container.insertBefore(error, container.firstChild);
    }
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (error && error.parentNode) {
        error.remove();
      }
    }, 5000);
  },

  formatTimeDuration: function(hours) {
    if (!hours || hours === 0) return '0h';
    if (hours < 1) {
      return Math.round(hours * 60) + 'm';
    } else if (hours < 8) {
      return hours.toFixed(1) + 'h';
    } else {
      var days = Math.floor(hours / 8);
      var remainingHours = (hours % 8);
      if (remainingHours > 0) {
        return days + 'd ' + remainingHours.toFixed(1) + 'h';
      } else {
        return days + 'd';
      }
    }
  },
  
  timeAgo: function(dateString) {
    if (!dateString) return 'unknown';
    var date = new Date(dateString);
    var now = new Date();
    var diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return diffInSeconds + ' seconds';
    if (diffInSeconds < 3600) return Math.floor(diffInSeconds / 60) + ' minutes';
    if (diffInSeconds < 86400) return Math.floor(diffInSeconds / 3600) + ' hours';
    if (diffInSeconds < 2592000) return Math.floor(diffInSeconds / 86400) + ' days';
    return Math.floor(diffInSeconds / 2592000) + ' months';
  },

  exportData: function(format) {
    var projectId = document.getElementById('project_id').value;
    var url = '/dashboard/export.' + format;
    if (projectId && projectId !== '') {
      url += '?project_id=' + projectId;
    }

    window.open(url, '_blank');
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  if (typeof dashboardData !== 'undefined') {
    Dashboard.init(dashboardData);
    // Dashboard.bindEvents();
  }
});