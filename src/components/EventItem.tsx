import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment';

import { TRedux } from '@reducers';
import { _kappa } from '@reducers/actions';
import {
  getAttendance,
  getExcuse,
  getEventRecords,
  prettyPoints,
  shouldLoad,
  canCheckIn
} from '@services/kappaService';
import { theme } from '@constants';
import { TUser } from '@backend/auth';
import { TEvent } from '@backend/kappa';
import RoundButton from '@components/RoundButton';
import Icon from '@components/Icon';
import Switch from '@components/Switch';
import HorizontalSegmentBar from '@components/HorizontalSegmentBar';
import LinkContainer from '@components/LinkContainer';

const EventItem: React.FC<{ event: TEvent }> = ({ event }) => {
  const user = useSelector((state: TRedux) => state.auth.user);
  const loadHistory = useSelector((state: TRedux) => state.kappa.loadHistory);
  const records = useSelector((state: TRedux) => state.kappa.records);
  const directory = useSelector((state: TRedux) => state.kappa.directory);
  const isGettingAttendance = useSelector((state: TRedux) => state.kappa.isGettingAttendance);
  const getAttendanceError = useSelector((state: TRedux) => state.kappa.getAttendanceError);
  const isDeletingEvent = useSelector((state: TRedux) => state.kappa.isDeletingEvent);

  const [expanded, setExpanded] = React.useState<boolean>(false);
  const [readyToDelete, setReadyToDelete] = React.useState<boolean>(false);
  const [visibleCategory, setVisibleCategory] = React.useState<string>('Attended');

  const dispatch = useDispatch();
  const dispatchGetAttendance = React.useCallback(
    (overwrite: boolean = false) => dispatch(_kappa.getEventAttendance(user, event._id, overwrite)),
    [dispatch, user, event._id]
  );
  const dispatchGetMyAttendance = React.useCallback(
    (overwrite: boolean = false) => dispatch(_kappa.getMyAttendance(user, overwrite)),
    [dispatch, user]
  );
  const dispatchEditEvent = React.useCallback(() => dispatch(_kappa.editExistingEvent(event._id)), [
    dispatch,
    event._id
  ]);
  const dispatchDeleteEvent = React.useCallback(() => dispatch(_kappa.deleteEvent(user, event)), [
    dispatch,
    event,
    user
  ]);
  const dispatchSetCheckInEvent = React.useCallback(
    (eventId: string, excuse: boolean) => dispatch(_kappa.setCheckInEvent(eventId, excuse)),
    [dispatch]
  );
  const dispatchShowBulkAttendance = React.useCallback(() => dispatch(_kappa.showBulkAttendance(event._id)), [
    dispatch,
    event._id
  ]);

  const loadData = React.useCallback(
    (force: boolean) => {
      if (user.privileged) {
        if (!isGettingAttendance && (force || (!getAttendanceError && shouldLoad(loadHistory, `event-${event._id}`)))) {
          dispatchGetAttendance(force);
        }

        setReadyToDelete(false);
      } else {
        if (!isGettingAttendance && (force || (!getAttendanceError && shouldLoad(loadHistory, `user-${user.email}`)))) {
          dispatchGetMyAttendance(force);
        }
      }
    },
    [
      user.privileged,
      user.email,
      isGettingAttendance,
      getAttendanceError,
      loadHistory,
      event._id,
      dispatchGetAttendance,
      dispatchGetMyAttendance
    ]
  );

  const onPressExpand = React.useCallback(() => {
    setExpanded(!expanded);
    setReadyToDelete(false);
  }, [expanded]);

  const onPressCheckIn = React.useCallback(() => {
    dispatchSetCheckInEvent(event._id, false);
  }, [dispatchSetCheckInEvent, event._id]);

  const onPressExcuse = React.useCallback(() => {
    dispatchSetCheckInEvent(event._id, true);
  }, [dispatchSetCheckInEvent, event._id]);

  const onChangeReadyToDelete = React.useCallback((newValue: boolean) => {
    setReadyToDelete(newValue);
  }, []);

  const onPressBarLabel = React.useCallback((label: string) => setVisibleCategory(label), []);

  const attended = getAttendance(records, user.email, event._id);
  const excused = getExcuse(records, user.email, event._id);
  const eventRecords = getEventRecords(directory, records, event._id);

  const chartData = React.useMemo(() => {
    return [
      { count: eventRecords.attended.length, label: 'Attended', color: theme.COLORS.PRIMARY },
      { count: eventRecords.excused.length, label: 'Excused', color: theme.COLORS.PRIMARY },
      { count: eventRecords.pending.length, label: 'Pending', color: theme.COLORS.INPUT_ERROR_LIGHT },
      {
        count: eventRecords.absent.length,
        label: 'Absent',
        color: theme.COLORS.LIGHT_BORDER
      }
    ];
  }, [
    eventRecords.absent.length,
    eventRecords.attended.length,
    eventRecords.excused.length,
    eventRecords.pending.length
  ]);

  const excuseDisabled = React.useMemo(() => {
    return (
      excused !== undefined ||
      attended !== undefined ||
      (event.excusable === false && moment(event.start).isAfter(moment(), 'day'))
    );
  }, [attended, event.excusable, event.start, excused]);

  const checkInDisabled = React.useMemo(() => {
    return attended !== undefined || !canCheckIn(event);
  }, [attended, event]);

  React.useEffect(() => {
    if (expanded) {
      loadData(false);
    }
  }, [expanded, loadData]);

  const renderExpanded = () => {
    return (
      <View style={styles.expandedContent}>
        <View style={styles.splitPropertyRow}>
          <View style={styles.splitProperty}>
            <Text style={styles.propertyHeader}>Location</Text>
            <Text style={styles.propertyValue}>{event.location}</Text>
          </View>

          <View style={styles.splitProperty}>
            <Text style={styles.propertyHeader}>Duration</Text>
            <Text style={styles.propertyValue}>
              {event.duration < 60
                ? `${event.duration} minutes`
                : moment.duration(event.duration, 'minutes').humanize()}
            </Text>
          </View>

          <View style={styles.splitProperty}>
            <Text style={styles.propertyHeader}>Points</Text>
            <Text style={styles.propertyValue}>{prettyPoints(event.points)}</Text>
          </View>

          <View style={styles.splitProperty}>
            <LinkContainer link={event.link}>
              <Text style={styles.propertyHeader}>Link</Text>
              <Text style={[styles.propertyValue, event.link && { color: theme.COLORS.PRIMARY }]} numberOfLines={1}>
                {event.link || 'N/A'}
              </Text>
            </LinkContainer>
          </View>
        </View>

        {user.privileged && (
          <React.Fragment>
            <View style={[styles.splitPropertyRow, { marginTop: 12 }]}>
              <View style={styles.splitProperty}>
                <Text style={styles.propertyHeader}>Check-In Code</Text>
                <Text style={styles.propertyValue}>{event.eventCode}</Text>
              </View>

              <View style={styles.chartArea}>
                <HorizontalSegmentBar data={chartData} pressableLabels={true} onPressLabel={onPressBarLabel} />
              </View>
            </View>

            <View style={styles.dangerZone}>
              <View style={styles.bulkAttendanceZone}>
                <View style={styles.warning}>
                  <Text style={styles.zoneLabel}>Manually add attendance</Text>
                  <Text style={styles.description}>
                    Adding attendance manually allows you to check in users to an event. This is designed for use with
                    events that are asynchronous or were not recorded with the app. Once a user has been added, you may
                    not remove them so double check your list.
                  </Text>
                </View>

                <TouchableOpacity disabled={isDeletingEvent} onPress={dispatchShowBulkAttendance}>
                  <Icon
                    style={styles.zoneIcon}
                    family="Feather"
                    name="user-plus"
                    size={32}
                    color={theme.COLORS.PRIMARY}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.editZone}>
                <View style={styles.warning}>
                  <Text style={styles.zoneLabel}>Edit this event</Text>
                  <Text style={styles.description}>
                    Edits to events will only show up when users refresh. Please make sure you have refreshed the latest
                    event details before editing.
                  </Text>
                </View>

                <TouchableOpacity disabled={isDeletingEvent} onPress={dispatchEditEvent}>
                  <Icon style={styles.zoneIcon} family="Feather" name="edit" size={32} color={theme.COLORS.PRIMARY} />
                </TouchableOpacity>
              </View>
              <View style={styles.deleteZone}>
                <View style={styles.warning}>
                  <Text style={styles.zoneLabel}>Delete this event</Text>
                  <Text style={styles.description}>
                    Deleting an event will delete all associated points, attendance and excuse records. Please double
                    check and be certain this is the event you want to delete.
                  </Text>
                </View>

                {isDeletingEvent ? (
                  <ActivityIndicator style={styles.zoneIcon} color={theme.COLORS.PRIMARY} />
                ) : (
                  <TouchableOpacity
                    style={!readyToDelete && styles.disabledButton}
                    disabled={!readyToDelete}
                    onPress={dispatchDeleteEvent}
                  >
                    <Icon
                      style={styles.zoneIcon}
                      family="Feather"
                      name="trash-2"
                      size={32}
                      color={theme.COLORS.PRIMARY}
                    />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.enableDeleteContainer}>
                <Switch value={readyToDelete} onValueChange={onChangeReadyToDelete} />
                <Text style={styles.readyToDelete}>I am ready to delete this event</Text>
              </View>
            </View>

            {!isGettingAttendance && (
              <View
                style={{
                  marginTop: 16
                }}
              >
                <Text style={styles.propertyHeader}>{visibleCategory}</Text>

                {visibleCategory === 'Attended' ? (
                  <View style={styles.mandatoryContainer}>
                    {eventRecords.attended.length > 0 ? (
                      eventRecords.attended.map((missed: TUser) => (
                        <Text key={missed._id} style={styles.mandatoryUser}>
                          {missed.familyName}, {missed.givenName}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.mandatoryUser}>No brothers</Text>
                    )}
                  </View>
                ) : visibleCategory === 'Excused' ? (
                  <View style={styles.mandatoryContainer}>
                    {eventRecords.excused.length > 0 ? (
                      eventRecords.excused.map((missed: TUser) => (
                        <Text key={missed._id} style={styles.mandatoryUser}>
                          {missed.familyName}, {missed.givenName}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.mandatoryUser}>No brothers</Text>
                    )}
                  </View>
                ) : visibleCategory === 'Pending' ? (
                  <View style={styles.mandatoryContainer}>
                    {eventRecords.pending.length > 0 ? (
                      eventRecords.pending.map((missed: TUser) => (
                        <Text key={missed._id} style={styles.mandatoryUser}>
                          {missed.familyName}, {missed.givenName}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.mandatoryUser}>No brothers</Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.mandatoryContainer}>
                    {eventRecords.absent.length > 0 ? (
                      eventRecords.absent.map((missed: TUser) => (
                        <Text key={missed._id} style={styles.mandatoryUser}>
                          {missed.familyName}, {missed.givenName}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.mandatoryUser}>No brothers</Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </React.Fragment>
        )}
      </View>
    );
  };

  return (
    <View style={styles.eventContainer}>
      <View style={styles.eventRow}>
        <View style={styles.eventContent}>
          <TouchableOpacity activeOpacity={0.4} onPress={onPressExpand}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDate}>{moment(event.start).format('h:mm A')}</Text>

              {event.mandatory && (
                <View style={styles.propertyWrapper}>
                  <Icon
                    style={styles.propertyIcon}
                    family="Feather"
                    name="alert-circle"
                    size={16}
                    color={theme.COLORS.PRIMARY}
                  />

                  <Text style={[styles.propertyText, { color: theme.COLORS.PRIMARY }]}>Mandatory</Text>
                </View>
              )}

              {attended !== undefined && (
                <View style={styles.propertyWrapper}>
                  <Icon
                    style={styles.propertyIcon}
                    family="Feather"
                    name="check"
                    size={16}
                    color={theme.COLORS.PRIMARY_GREEN}
                  />

                  <Text style={[styles.propertyText, { color: theme.COLORS.PRIMARY_GREEN }]}>Checked In</Text>
                </View>
              )}

              {excused !== undefined && excused.approved && (
                <View style={styles.propertyWrapper}>
                  <Icon
                    style={styles.propertyIcon}
                    family="Feather"
                    name="check"
                    size={16}
                    color={theme.COLORS.PRIMARY_GREEN}
                  />

                  <Text style={[styles.propertyText, { color: theme.COLORS.PRIMARY_GREEN }]}>Excused</Text>
                </View>
              )}

              {excused !== undefined && !excused.approved && (
                <View style={styles.propertyWrapper}>
                  <Icon
                    style={styles.propertyIcon}
                    family="Feather"
                    name="clock"
                    size={16}
                    color={theme.COLORS.YELLOW_GRADIENT_END}
                  />

                  <Text style={[styles.propertyText, { color: theme.COLORS.YELLOW_GRADIENT_END }]}>
                    Excuse under review
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.eventDescriptionWrapper}>
              <Text style={styles.eventDescription}>{event.description}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View>
          <View style={styles.checkInButton}>
            <RoundButton label="Check In" alt={true} disabled={checkInDisabled} onPress={onPressCheckIn} />
          </View>

          <TouchableOpacity activeOpacity={0.6} disabled={excuseDisabled} onPress={onPressExcuse}>
            <Text
              style={[
                styles.requestExcuseText,
                excuseDisabled && {
                  opacity: 0.4
                }
              ]}
            >
              Request Excuse
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {expanded && renderExpanded()}
    </View>
  );
};

const styles = StyleSheet.create({
  eventContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16
  },
  eventRow: {
    width: '100%',
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start'
  },
  eventContent: {
    flex: 1
  },
  checkInButton: {
    marginBottom: 8
  },
  requestExcuseText: {
    height: '100%',
    textAlign: 'center',
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 14,
    color: theme.COLORS.PRIMARY
  },
  eventHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap'
  },
  eventTitle: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 13
  },
  eventDate: {
    marginLeft: 8,
    fontFamily: 'OpenSans',
    fontSize: 13,
    color: theme.COLORS.DARK_GRAY
  },
  propertyWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  propertyIcon: {
    marginLeft: 8
  },
  propertyText: {
    marginLeft: 4,
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 13
  },
  eventDescriptionWrapper: {
    marginTop: 8
  },
  eventDescription: {
    fontFamily: 'OpenSans',
    fontSize: 15
  },
  expandedContent: {
    marginTop: 16
  },
  splitPropertyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  splitProperty: {
    marginRight: 24
  },
  propertyHeader: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 13,
    textTransform: 'uppercase',
    color: theme.COLORS.GRAY
  },
  propertyValue: {
    marginTop: 4,
    fontFamily: 'OpenSans',
    fontSize: 15
  },
  chartArea: {
    marginLeft: 16,
    flex: 1
  },
  dangerZone: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: theme.COLORS.INPUT_ERROR_LIGHT
  },
  bulkAttendanceZone: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  editZone: {
    marginTop: 16,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  deleteZone: {
    marginTop: 16,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  warning: {
    flex: 1,
    marginRight: 8
  },
  zoneLabel: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14
  },
  description: {
    marginTop: 2,
    fontFamily: 'OpenSans',
    fontSize: 12
  },
  zoneIcon: {
    width: 32
  },
  enableDeleteContainer: {
    marginTop: 8,
    marginLeft: 16,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  readyToDelete: {
    marginLeft: 8,
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 13
  },
  disabledButton: {
    opacity: 0.4
  },
  mandatoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  mandatoryUser: {
    marginRight: 16,
    fontFamily: 'OpenSans',
    fontSize: 13
  }
});

export default EventItem;
