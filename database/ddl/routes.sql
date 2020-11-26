create table routes (
	id         integer not null
		constraint routes_pk
			primary key autoincrement,
	seq        integer not null default 1,
	domain     text,
	port       integer not null default 80,
	prefix     text,
	secure     integer not null default 0,
	keyFile    text,
	certFile   text,
	enabled    integer not null default 1,
	target     text    not null,
	tDirectory text,
	tAddr      text,
	tPort      integer,
	tLocation  text
);


create unique index routes_id_uindex
	on routes (id);


create unique index routes_uindex
	on routes (domain, port, prefix);
