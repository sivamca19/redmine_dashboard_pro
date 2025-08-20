var Dashboard = {
  charts: {},
  
  init: function(data) {
    this.data = data;
    this.initCharts();
    // this.bindEvents();
    console.log('Dashboard initialized for:', data.project);
  },
  

  initCharts: function() {
    this.createIssueStatusChart();
    this.createTimeTrackingChart();
    this.createUserActivityChart();
    this.createIssueDistributionChart();
  },
  
  createIssueStatusChart: function() {
    var ctx = document.getElementById('issueStatusChart');
    if (!ctx) return;

    if (this.charts.issueStatus) {
      this.charts.issueStatus.destroy();
    }
    
    var data = this.data.issuesByStatus;
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
    
    var dailyData = this.data.dailyTime;
    var labels = Object.keys(dailyData).slice(-14); // Last 14 days
    var values = labels.map(function(date) { return dailyData[date]; });
    
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
    
    var data = this.data.timeByUser;
    var labels = Object.keys(data).slice(0, 8); // Top 8 users
    var values = labels.map(function(user) { return data[user]; });
    
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
    
    var data = this.data.issuesByTracker;
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
    var url = '/dashboard.json';
    if (projectId && projectId !== '') {
      url += '?project_id=' + projectId;
    }
    
    this.showLoading();
    fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
    })
      .then(response => response.json())
      .then(data => {
        console.log("data", data)
        this.data = data;
        this.updateDashboard(data);
        this.updateCharts(data);
        this.hideLoading();
        
        // Update URL without page refresh
        window.history.pushState({}, '', url.replace(/\.json(?=\?|$)/, ""));
      })
      .catch(error => {
        console.error('Error loading dashboard data:', error);
        this.hideLoading();
      });
  },
  
  updateDashboard: function(data) {
    // Update overview cards
    document.getElementById('total-projects').textContent = data.overview.total_projects;
    document.getElementById('total-issues').textContent = data.overview.total_issues;
    document.getElementById('total-users').textContent = data.overview.total_users;
    document.getElementById('total-time').textContent = this.formatTimeDuration(data.overview.total_time);
    
    // Update active users
    var activeUsersEl = document.getElementById('active-users');
    if (activeUsersEl) {
      activeUsersEl.textContent = data.activity.active_users;
    }
    
    // Update recent issues
    this.updateRecentIssues(data.issues.recent);
    
    // Update activity feed
    this.updateActivityFeed(data.activity.recent);
  },
  
  updateRecentIssues: function(issues) {
    var container = document.getElementById('recent-issues');
    if (!container) return;
    
    container.innerHTML = '';
    
    issues.forEach(function(issue) {
      var issueEl = document.createElement('div');
      issueEl.className = 'issue-item';
      issueEl.innerHTML = `
        <div class="issue-header">
          <a href="/issues/${issue.id}" class="issue-link">#${issue.id}</a>
          <span class="badge badge-${issue.status.toLowerCase().replace(' ', '-')}">${issue.status}</span>
        </div>
        <div class="issue-subject">${issue.subject.substring(0, 60)}${issue.subject.length > 60 ? '...' : ''}</div>
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
    
    activities.forEach(function(activity) {
      var activityEl = document.createElement('div');
      activityEl.className = `activity-item ${activity.type}`;
      activityEl.innerHTML = `
        <div class="activity-icon">
          <i class="icon-${activity.type}"></i>
        </div>
        <div class="activity-content">
          <div class="activity-description">${activity.description}</div>
          <div class="activity-meta">
            <span class="user">${activity.user}</span>
            <span class="date">${Dashboard.timeAgo(activity.date)} ago</span>
          </div>
        </div>
      `;
      container.appendChild(activityEl);
    });
  },
  
  updateCharts: function(data) {
    // Destroy existing charts
    Object.keys(this.charts).forEach(key => {
      if (this.charts[key]) {
        this.charts[key].destroy();
      }
    });
    if (typeof data !== 'undefined') {
      Dashboard.init(data);
    }
    // Recreate charts with new data
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
  },
  
  refreshData: function() {
    var currentProjectId = this.data.projectId;
    this.switchProject(currentProjectId);
  },
  
  showLoading: function() {
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
  
  formatTimeDuration: function(hours) {
    if (hours < 1) {
      return Math.round(hours * 60) + 'm';
    } else if (hours < 8) {
      return hours.toFixed(1) + 'h';
    } else {
      var days = Math.floor(hours / 8);
      var remainingHours = (hours % 8).toFixed(1);
      return days + 'd ' + remainingHours + 'h';
    }
  },
  
  timeAgo: function(dateString) {
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
  }
});