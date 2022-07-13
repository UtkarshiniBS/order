----------------------------- Coinout DB -> Export users - Query ---------------------------
--- IOS - Production date -> 29th October 2021
select c.uuid from  customers c where ios_client_version='coinout-3.1.26-468';
--- Android - Production date -> 24th November 2021
select c.uuid from customers c where android_client_version='1.234-production';
----------------------------- Coinout DB -> End of Coinout Export users - Query ------------

--- Steps
--- Export data from Coinout DB to get latest users updated the App
--- Create tables relative to this in Prod table in IRI 
--- Import the data to this table
--- Execute the following queries for reports replacing table name with version updated accordingly 

----------------------------- IOS Plaform - Queries --------------------------------------------

-- Total Connections - IOS users
select count(1) from "krogerConnection" where created_at between '2021-10-29 00:00:00' and '2021-11-25 00:00:00' and panelist_id in (select uuid from ios_468_users);

-- Connections Breakdown - IOS users
select count(1), status, order_status,message from "krogerConnection" ac where created_at between '2021-10-29 00:00:00' and '2021-11-25 00:00:00'  
and panelist_id in (select uuid from ios_468_users) group by status, order_status, message; 

-- Total unsuccessfull Connections - IOS Logs table
select distinct message, count(*) from (select  created, message, count(*)  from (
	select distinct al.panelist_id ,al.platform_id ,al.status ,cast(al.created_at as DATE) as created, al.message from "krogerLogs" al 
	left join "krogerConnection" ac on ac.panelist_id = al.panelist_id and ac.platform_id = al.platform_id
	where ac.id is null and al.status = 'fail' and al."section" = 'connection' 
	and al.created_at between '2021-10-29 00:00:00' and '2021-11-25 00:00:00' and al.panelist_id in (select uuid from ios_468_users iu)
	order by al.panelist_id
) a group by created, message order by message) ods group by message;

-- Successfull Order Srapping by consequent days - IOS
select a.scrapping_type,
    count(panelist_id),
    a.panelist_scraping_count
from (
        select CAST(created_at as DATE),
            panelist_id,
            count(panelist_id) as panelist_scraping_count,
            scrapping_type
        from "krogerOrderHistory"
        where panelist_id in (
                select panelist_id
                from "krogerConnection"
                where created_at > '2021-10-29 00:00:00'
                    and panelist_id in (
                        select uuid
                        from ios_468_users
                    )
            )
            and created_at between '2021-10-29 00:00:00' and '2021-11-25 00:00:00'
        group by CAST(created_at as DATE),
            scrapping_type,
            panelist_id
        order by created_at
    ) a
group by a.panelist_scraping_count,
    a.scrapping_type
order by a.panelist_scraping_count;

-- Failed Order Srapping day wise - iOS 
select  count(*), a."scrappingType" from (
select distinct al.panelist_id ,al.platform_id ,al.status,al.from_date ,al.to_date  ,cast(al.created_at as DATE) as created,
oh.id,oh.storage_type, "scrappingType" from "krogerLogs" al left join "krogerOrderHistory" oh on 
oh.panelist_id =al.panelist_id and oh.platform_id =al.platform_id and oh.from_date =al.from_date and oh.to_date =al.to_date
where oh.id is null and al.status ='fail' and al."section" ='orderUpload' 
and al.panelist_id in (select panelist_id from "krogerConnection" where created_at > '2021-10-29 00:00:00') and al.panelist_id in ( select uuid from ios_468_users iul )
and al.created_at between '2021-10-29 00:00:00' and '2021-11-25 00:00:00'
order by al.panelist_id,from_date ,to_date ) a group by a."scrappingType";


-- Error message grouping for failed order scraping - iOS
select count(*), "scrappingType", message, type from (
select distinct al.panelist_id ,al.platform_id ,al.status,al.from_date ,al.to_date  ,cast(al.created_at as DATE) as created,
oh.id,oh.storage_type, "scrappingType" ,message,type from "krogerLogs" al left join "krogerOrderHistory" oh on 
oh.panelist_id =al.panelist_id and oh.platform_id =al.platform_id and oh.from_date =al.from_date and oh.to_date =al.to_date
where oh.id is null and al.status ='fail' and al."section" ='orderUpload'
and al.panelist_id in (select panelist_id from "krogerConnection" where created_at > '2021-10-29 00:00:00' and panelist_id in ( select uuid from ios_468_users iul ) )
and al.created_at between '2021-10-29 00:00:00' and '2021-11-25 00:00:00'
order by al.panelist_id,al.from_date ,al.to_date ) a group by a."scrappingType",message,type order by count(*) desc;

-----------------------------End of IOS Plaform - Queries --------------------------------------

----------------------------- Android Plaform - Queries ----------------------------------------

-- Total Connections - Android users
select count(1) from "krogerConnection" where created_at between '2021-11-24 00:00:00' and '2021-11-25 00:00:00' and panelist_id in (select uuid from android_234_users);

-- Connections Breakdown - Android users
select count(1), status, order_status,message from "krogerConnection" ac where created_at between '2021-11-24 00:00:00' and '2021-11-25 00:00:00'
and panelist_id in (select uuid from android_234_users) group by status, order_status, message; 

-- Total unsuccessfull Connections - Android Logs table
select distinct message, count(*) from (select  created, message, count(*)  from (
	select distinct al.panelist_id ,al.platform_id ,al.status ,cast(al.created_at as DATE) as created, al.message from "krogerLogs" al 
	left join "krogerConnection" ac on ac.panelist_id = al.panelist_id and ac.platform_id = al.platform_id
	where ac.id is null and al.status = 'fail' and al."section" = 'connection' 
	and al.created_at between '2021-11-24 00:00:00' and '2021-11-25 00:00:00' and al.panelist_id in (select uuid from android_234_users)
	order by al.panelist_id
) a group by created, message order by message) ods group by message;

-- Successfull Order Srapping by consequent days - Android 
select a.scrapping_type,
    count(panelist_id),
    a.panelist_scraping_count
from (
        select CAST(created_at as DATE),
            panelist_id,
            count(panelist_id) as panelist_scraping_count,
            scrapping_type
        from "krogerOrderHistory"
        where panelist_id in (
                select panelist_id
                from "krogerConnection"
                where created_at > '2021-11-24 00:00:00'
                    and panelist_id in (
                        select uuid
                        from android_234_users
                    )
            )
            and created_at between '2021-11-24 00:00:00' and '2021-11-25 00:00:00'
        group by CAST(created_at as DATE),
            scrapping_type,
            panelist_id
        order by created_at
    ) a
group by a.panelist_scraping_count,
    a.scrapping_type
order by a.panelist_scraping_count;


-- Failed Order Srapping day wise - Android 
select  count(*),"scrappingType" from (
select distinct al.panelist_id ,al.platform_id ,al.status,al.from_date ,al.to_date  ,cast(al.created_at as DATE) as created,
oh.id,oh.storage_type, "scrappingType" from "krogerLogs" al left join "krogerOrderHistory" oh on 
oh.panelist_id =al.panelist_id and oh.platform_id =al.platform_id and oh.from_date =al.from_date and oh.to_date =al.to_date
where oh.id is null and al.status ='fail' and al."section" ='orderUpload' 
and al.panelist_id in (select panelist_id from "krogerConnection" where created_at > '2021-11-24 00:00:00') and al.panelist_id in ( select uuid from android_234_users au )
and al.created_at between '2021-11-24 00:00:00' and '2021-11-25 00:00:00'
order by al.panelist_id,from_date ,to_date ) a group by a."scrappingType";


-- Error message grouping for failed order scraping - Android
select count(*), "scrappingType", message, type from (
select distinct al.panelist_id ,al.platform_id ,al.status,al.from_date ,al.to_date  ,cast(al.created_at as DATE) as created,
oh.id,oh.storage_type, "scrappingType" ,message,type from "krogerLogs" al left join "krogerOrderHistory" oh on 
oh.panelist_id =al.panelist_id and oh.platform_id =al.platform_id and oh.from_date =al.from_date and oh.to_date =al.to_date
where oh.id is null and al.status ='fail' and al."section" ='orderUpload'
and al.panelist_id in (select panelist_id from "krogerConnection" where created_at > '2021-11-24 00:00:00' and panelist_id in ( select uuid from android_234_users iul ) )
and al.created_at between '2021-11-24 00:00:00' and '2021-11-25 00:00:00'
order by al.panelist_id,al.from_date ,al.to_date ) a group by a."scrappingType",message,type order by count(*) desc;

-----------------------------End of Android Plaform - Queries ----------------------------------
