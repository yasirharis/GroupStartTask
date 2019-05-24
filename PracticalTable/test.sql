exec HowMuchCopies 1 --test copies = 1
exec HowMuchCopies 200 --test copies = 200
exec HowMuchCopies --test to show all record
exec HowMuchCopies 0 --test copies = 0, invalid copies
exec HowMuchCopies 300 --test copies = 300, invalid copies