create procedure HowMuchCopies
@copies int = -1
as
BEGIN
SET NOCOUNT ON; --avoid unnecessary result

declare 
@isAll bit = 0,
@min int = 1,
@max int = 200, --since <=200
@i int = 0

if @copies = -1 
begin
	set @copies = @max --set copies to maximum if copies not specified
	set @isAll = 1 --set to show all record
end

if @copies < @min OR @copies > @max
BEGIN
 SELECT 'INVALID COPIES ('+ cast(@min as varchar(100)) +' <= N <= '+ cast(@max as varchar(100)) +']), Your Input -> ' + cast(@copies as varchar(100)) as RESULT --show error
 RETURN
END

create table #A (copies int,val int) --table to hold copies per table and its square values
create table #T (copies int,table_1 int,table_2 int,table_3 int,table_4 int) --table to hold copies for 4 table

set @i = @min

while(@i <= @max)
begin
 insert into #A values(@i*@i,@i)
 set @i += 1
end

declare 
@t1 int = 0,
@t2 int = 0,
@t3 int = 0,
@t4 int = 0,
@v1 int = 0,
@v2 int = 0,
@v3 int = 0,
@v4 int = 0

set @i = @min
while(@i <= @max)
begin 

 select top 1 @v1=val,@t1=copies from #A where copies <= @i order by copies desc --table 01
 select top 1 @v2=val,@t2=copies from #A where copies <= (@i - @t1) and (@i - @t1) > 0 order by copies desc --table 02
 select top 1 @v3=val,@t3=copies from #A where copies <= (@i - @t1 - @t2) and (@i - @t1 - @t2) > 0 order by copies desc --table 03
 select top 1 @v4=val,@t4=copies from #A where copies <= (@i - @t1  - @t2 - @t3) and (@i - @t1 - @t2 - @t3) > 0 order by copies desc --table 04
 insert into #T values(@i,@v1,@v2,@v3,@v4) --insert to temp table

 set @i += 1 --next copies
 if(@copies < @i) break --stop unnecessary looping
 --reset value
 set @v1= 0
 set @v2= 0
 set @v3= 0
 set @v4= 0
 set @t1= 0
 set @t2= 0
 set @t3= 0
 set @t4= 0
end

if @isAll = 1
	select * from #T --show all result
		else
	select * from #T where copies = @copies --show result base on spesific copies

drop table #A --clean up
drop table #T --clean up

END
