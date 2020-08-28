create table hosts (
	id        integer not null
		constraint hosts_pk
			primary key autoincrement,
	subdomain text,
	port      text,
	prefix    text
);

create unique index hosts_id_uindex
	on hosts (id);

create unique index hosts_uindex
	on hosts (subdomain, port, prefix);
