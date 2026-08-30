import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { accommodationApi, eventApi } from '../../api';
import { 
  Search, 
  Plus,
  Eye,
  Home,
  Users,
  MapPin,
  Building,
  Bed,
  Calendar
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useTranslation } from '../../contexts/LanguageContext';

export default function AccommodationList() {
  const navigate = useNavigate();
  const { user, isAdmin, isCoordinator } = useAuth();
  const { t } = useTranslation();
  
  const [accommodations, setAccommodations] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const isUnionAdmin = isAdmin || user?.position === 'UNION_ADMINISTRATOR';
  const canManage = isUnionAdmin || isCoordinator;

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchAccommodations();
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = isCoordinator && !isUnionAdmin
        ? await eventApi.getMyEvents()
        : await eventApi.getAll();
      
      if (response.data.success) {
        const eventList = response.data.data || [];
        setEvents(eventList);
        
        // Auto-select first event or upcoming event
        if (eventList.length > 0) {
          const upcomingEvent = eventList.find(e => 
            e.status === 'REGISTRATION_OPEN' || e.status === 'IN_PROGRESS'
          );
          setSelectedEventId((upcomingEvent || eventList[0]).id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setAlert({
        type: 'error',
        message: 'Failed to fetch events'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAccommodations = async () => {
    try {
      setLoading(true);
      const response = await accommodationApi.getByEvent(selectedEventId);
      if (response.data.success) {
        setAccommodations(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching accommodations:', error);
      // Don't show error for 404 (no accommodations yet)
      if (error.response?.status !== 404) {
        setAlert({
          type: 'error',
          message: 'Failed to fetch accommodations'
        });
      }
      setAccommodations([]);
    } finally {
      setLoading(false);
    }
  };

  const getCapacityPercentage = (accommodation) => {
    if (!accommodation.totalCapacity || accommodation.totalCapacity === 0) return 0;
    return Math.round((accommodation.occupiedCount / accommodation.totalCapacity) * 100);
  };

  const getCapacityBadge = (percentage) => {
    if (percentage >= 100) {
      return { variant: 'error', label: 'Full' };
    } else if (percentage >= 80) {
      return { variant: 'warning', label: 'Almost Full' };
    } else if (percentage >= 50) {
      return { variant: 'info', label: 'Half Full' };
    } else {
      return { variant: 'success', label: 'Available' };
    }
  };

  const eventOptions = [
    { value: '', label: 'Select an event...' },
    ...events.map(event => ({ 
      value: event.id.toString(), 
      label: `${event.name} (${new Date(event.startDate).toLocaleDateString()})` 
    }))
  ];

  const selectedEvent = events.find(e => e.id.toString() === selectedEventId);

  // Calculate total statistics
  const stats = {
    totalBuildings: accommodations.length,
    totalCapacity: accommodations.reduce((sum, acc) => sum + (acc.totalCapacity || 0), 0),
    totalOccupied: accommodations.reduce((sum, acc) => sum + (acc.occupiedCount || 0), 0),
    totalAvailable: accommodations.reduce((sum, acc) => sum + ((acc.totalCapacity || 0) - (acc.occupiedCount || 0)), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accommodation Management</h1>
          <p className="text-gray-600 mt-1">
            Manage event accommodations, rooms, and participant assignments
          </p>
        </div>

        {canManage && selectedEventId && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate(`/accommodation/new/${selectedEventId}`)}
          >
            Add Accommodation
          </Button>
        )}
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Event Selection */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <Select
                label="Select Event"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                options={eventOptions}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <Card>
          <CardBody>
            <div className="text-center py-8 text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Fetching accommodations...</span>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : !selectedEventId ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Calendar className="w-12 h-12" />}
              title="No event selected"
              description="Select an event to view and manage its accommodations"
            />
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Statistics */}
          {accommodations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Buildings</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalBuildings}</p>
                    </div>
                    <Building className="w-8 h-8 text-gray-400" />
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Capacity</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalCapacity}</p>
                    </div>
                    <Bed className="w-8 h-8 text-gray-400" />
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Occupied</p>
                      <p className="text-2xl font-bold text-primary-600">{stats.totalOccupied}</p>
                    </div>
                    <Users className="w-8 h-8 text-primary-400" />
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Available</p>
                      <p className="text-2xl font-bold text-green-600">{stats.totalAvailable}</p>
                    </div>
                    <Home className="w-8 h-8 text-green-400" />
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Accommodations Grid */}
          {accommodations.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState
                  icon={<Home className="w-12 h-12" />}
                  title="No accommodations found"
                  description={`No accommodations have been added for ${selectedEvent?.name || 'this event'} yet`}
                  action={
                    canManage && (
                      <Button
                        variant="primary"
                        onClick={() => navigate(`/accommodation/new/${selectedEventId}`)}
                      >
                        Add First Accommodation
                      </Button>
                    )
                  }
                />
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accommodations.map(accommodation => {
                const capacityPercentage = getCapacityPercentage(accommodation);
                const capacityBadge = getCapacityBadge(capacityPercentage);

                return (
                  <Card key={accommodation.id} className="hover:shadow-lg transition-shadow">
                    <CardBody>
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center">
                              <Building className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {accommodation.buildingName || accommodation.name}
                              </h3>
                              {accommodation.location && (
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {accommodation.location}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Capacity Info */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Capacity</span>
                            <span className="font-medium text-gray-900">
                              {accommodation.occupiedCount || 0} / {accommodation.totalCapacity || 0}
                            </span>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                capacityPercentage >= 100 ? 'bg-red-500' :
                                capacityPercentage >= 80 ? 'bg-yellow-500' :
                                capacityPercentage >= 50 ? 'bg-blue-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                            ></div>
                          </div>

                          <div className="flex items-center justify-between">
                            <Badge variant={capacityBadge.variant} size="sm">
                              {capacityBadge.label}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {capacityPercentage}% occupied
                            </span>
                          </div>
                        </div>

                        {/* Room Info */}
                        <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Home className="w-4 h-4" />
                            <span>{accommodation.roomCount || 0} rooms</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Bed className="w-4 h-4" />
                            <span>{(accommodation.totalCapacity || 0) - (accommodation.occupiedCount || 0)} available</span>
                          </div>
                        </div>

                        {/* Description */}
                        {accommodation.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {accommodation.description}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Eye className="w-4 h-4" />}
                            onClick={() => navigate(`/accommodation/${accommodation.id}`)}
                            className="flex-1"
                          >
                            View Details
                          </Button>
                          {canManage && (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<Users className="w-4 h-4" />}
                              onClick={() => navigate(`/accommodation/${accommodation.id}/assign`)}
                            >
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
