import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, X, DollarSign, User, Calendar, CreditCard } from 'lucide-react';
import { purchaseService } from '../services/purchaseService';
import { AdminNotification } from '../lib/supabase';

const AdminPurchaseNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [showAll]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    const result = await purchaseService.getAdminNotifications(!showAll);
    if (result.success && result.notifications) {
      setNotifications(result.notifications);
      setUnreadCount(result.notifications.filter((n: AdminNotification) => !n.is_read).length);
    }
    setIsLoading(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await purchaseService.markNotificationAsRead(notificationId);
    fetchNotifications();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <DollarSign className="w-5 h-5 text-green-400" />;
      case 'signup':
        return <User className="w-5 h-5 text-blue-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-blue-500/30 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="w-6 h-6 text-blue-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white">Purchase Notifications</h2>
        </div>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {showAll ? 'Show Unread Only' : 'Show All'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No notifications to display</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map((notification: any) => (
            <div
              key={notification.id}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                notification.is_read
                  ? 'bg-gray-800/30 border-gray-700'
                  : 'bg-gradient-to-r from-blue-600/10 to-green-600/10 border-blue-500/50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.notification_type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-sm mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-2">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="flex-shrink-0 ml-2 text-blue-400 hover:text-blue-300 transition-colors"
                        title="Mark as read"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {notification.metadata && (
                    <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                      {notification.metadata.user_email && (
                        <div className="flex items-center space-x-2 text-gray-400">
                          <User className="w-3 h-3" />
                          <span>{notification.metadata.user_email}</span>
                        </div>
                      )}
                      {notification.metadata.amount && (
                        <div className="flex items-center space-x-2 text-green-400">
                          <DollarSign className="w-3 h-3" />
                          <span>${notification.metadata.amount}</span>
                        </div>
                      )}
                      {notification.metadata.plan_name && (
                        <div className="flex items-center space-x-2 text-blue-400">
                          <CreditCard className="w-3 h-3" />
                          <span>{notification.metadata.plan_name}</span>
                        </div>
                      )}
                      {notification.metadata.payment_method && (
                        <div className="flex items-center space-x-2 text-gray-400">
                          <CreditCard className="w-3 h-3" />
                          <span className="capitalize">{notification.metadata.payment_method}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(notification.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPurchaseNotifications;
