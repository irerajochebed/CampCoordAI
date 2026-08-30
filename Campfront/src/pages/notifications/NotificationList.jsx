import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { 
  Bell, 
  CheckCircle, 
  Mail, 
  Trash2, 
  Reply, 
  ExternalLink, 
  CheckCheck, 
  RefreshCw,
  Send,
  X,
  MessageSquare,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Textarea from '../../components/ui/Textarea';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

export default function NotificationList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [alert, setAlert] = useState(null);
  
  // Reply Modal State
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getMyNotifications();
      const notifs = res.data?.data || res.data || [];
      if (Array.isArray(notifs)) {
        setNotifications(notifs);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setAlert({ type: 'error', message: 'Failed to load notifications' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRead = async (notif) => {
    try {
      if (notif.isRead) {
        await notificationApi.markAsUnread(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: false, readAt: null } : n));
      } else {
        await notificationApi.markAsRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to update notification status' });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setAlert({ type: 'success', message: 'All notifications marked as read' });
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to mark all as read' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    try {
      await notificationApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setAlert({ type: 'success', message: 'Notification deleted successfully' });
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to delete notification' });
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSendingReply(true);
    try {
      await notificationApi.reply(replyTarget.id, replyMessage.trim());
      setAlert({ type: 'success', message: `Reply sent successfully to ${replyTarget.senderName || 'sender'}` });
      setReplyTarget(null);
      setReplyMessage('');
      fetchNotifications();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to send reply' });
    } finally {
      setSendingReply(false);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return <PageSpinner message="Loading notifications..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications & Alerts</h1>
          <p className="text-gray-600 mt-1">
            View updates, review alerts, and reply to messages from coordinators and leaders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<RefreshCw className="w-4 h-4" />} 
            onClick={fetchNotifications}
          >
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              icon={<CheckCheck className="w-4 h-4" />} 
              onClick={handleMarkAllRead}
            >
              Mark All Read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-3">
        <Button
          variant={filter === 'ALL' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('ALL')}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === 'UNREAD' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('UNREAD')}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={<Bell className="w-12 h-12 text-gray-400" />}
                title={filter === 'UNREAD' ? 'No Unread Notifications' : 'No Notifications'}
                message={filter === 'UNREAD' ? 'You have read all your notifications.' : 'Your notification inbox is currently empty.'}
              />
            </CardBody>
          </Card>
        ) : (
          filteredNotifications.map((notif) => {
            const isUnread = !notif.isRead;
            return (
              <Card 
                key={notif.id}
                className={`transition-all ${
                  isUnread 
                    ? 'border-blue-300 bg-blue-50/40 shadow-sm ring-1 ring-blue-500/20' 
                    : 'border-gray-200 hover:shadow-sm'
                }`}
              >
                <CardBody className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-xl flex-shrink-0 ${
                      isUnread ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {notif.parentNotificationId ? (
                        <MessageSquare className="w-5 h-5" />
                      ) : notif.eventName ? (
                        <Calendar className="w-5 h-5" />
                      ) : (
                        <Bell className="w-5 h-5" />
                      )}
                    </div>

                    {/* Notification Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <h3 className={`text-base font-bold ${isUnread ? 'text-blue-950' : 'text-gray-900'}`}>
                          {notif.title}
                        </h3>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : ''}
                        </span>
                      </div>

                      {/* Sender Info */}
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>From: <strong className="text-gray-700">{notif.senderName || 'System'}</strong></span>
                        {notif.eventName && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 font-medium">Event: {notif.eventName}</span>
                          </>
                        )}
                        {isUnread && (
                          <Badge variant="danger" size="sm" className="ml-2 py-0 px-1.5 text-[10px]">NEW</Badge>
                        )}
                      </div>

                      {/* Message Body */}
                      <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Parent Notification Reference (if reply) */}
                      {notif.parentNotificationTitle && (
                        <div className="mt-2.5 p-2.5 bg-gray-100/70 border-l-2 border-primary-500 rounded-r-md text-xs text-gray-600">
                          <span className="font-semibold text-gray-800">In response to:</span> "{notif.parentNotificationTitle}"
                        </div>
                      )}

                      {/* Actions Toolbar */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Take Action / View link */}
                          {notif.actionUrl && (
                            <Link to={notif.actionUrl}>
                              <Button variant="primary" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                                Take Action
                              </Button>
                            </Link>
                          )}

                          {/* Reply Button */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            icon={<Reply className="w-3.5 h-3.5" />}
                            onClick={() => {
                              setReplyTarget(notif);
                              setReplyMessage('');
                            }}
                          >
                            Reply
                          </Button>

                          {/* Toggle Read/Unread */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleToggleRead(notif)}
                          >
                            {isUnread ? 'Mark as Read' : 'Mark as Unread'}
                          </Button>
                        </div>

                        {/* Delete */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                          onClick={() => handleDelete(notif.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}
      </div>

      {/* REPLY MODAL */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Reply className="w-5 h-5 text-primary-600" />
                <h3 className="text-base font-bold text-gray-900">Reply to Notification</h3>
              </div>
              <button 
                onClick={() => setReplyTarget(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSendReply} className="p-6 space-y-4">
              {/* Context Summary */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs space-y-1">
                <p className="font-semibold text-blue-900">Replying to: {replyTarget.senderName || 'Sender'}</p>
                <p className="text-blue-800 line-clamp-2">"{replyTarget.message}"</p>
              </div>

              <Textarea
                label="Your Response Message"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your response or instructions to the sender..."
                rows={4}
                required
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setReplyTarget(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  icon={<Send className="w-4 h-4" />}
                  loading={sendingReply}
                  disabled={!replyMessage.trim()}
                >
                  Send Reply
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
