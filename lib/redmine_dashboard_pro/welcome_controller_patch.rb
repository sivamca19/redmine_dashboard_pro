module RedmineDashboardPro
  module WelcomeControllerPatch
    def self.included(base)
      base.class_eval do
        alias_method :original_index, :index

        def index
          if User.current.admin? || User.current.allowed_to?(:view_dashboard, nil, global: true)
            redirect_to controller: 'dashboard', action: 'index'
          else
            original_index
          end
        end
      end
    end
  end
end
