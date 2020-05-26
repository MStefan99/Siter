create table ports (
	id     integer not null
		constraint ports_pk
			primary key,
	port   integer not null,
	module text    default null,
	active integer default 1 not null
);

create unique index ports_id_uindex
	on ports (id);

create unique index ports_port_uindex
	on ports (port);
