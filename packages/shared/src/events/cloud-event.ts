export interface CloudEvent<T = unknown> {
  id: string;
  source: string;
  specversion: '1.0';
  type: string;
  time: string;
  datacontenttype: 'application/json';
  data: T;
}
