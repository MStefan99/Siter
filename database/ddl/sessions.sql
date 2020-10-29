create table sessions (
	id   text not null
		constraint sessions_pk
			primary key,
	ip   text not null,
	ua   text not null,
	time text not null
);


create unique index sessions_id_uindex
	on sessions (id);
