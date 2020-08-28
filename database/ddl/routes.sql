create table routes (
	id         integer not null
		constraint routes_pk
			primary key autoincrement,
	secure     integer not null default 0,
	subdomain  text,
	port       integer not null default 80,
	prefix     text,
	directory  text,
	targetIP   text,
	targetPort integer
);

create unique index routes_id_uindex
	on routes (id);

create unique index routes_uindex
	on routes (subdomain, port, prefix);
