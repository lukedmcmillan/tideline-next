-- Expand event_type values for blue finance and other tracker agents

alter table tracker_events drop constraint if exists tracker_events_event_type_check;
alter table tracker_events add constraint tracker_events_event_type_check
  check (event_type in ('milestone', 'setback', 'update', 'deal_announced', 'deal_closed', 'framework_published', 'rating_issued'));
