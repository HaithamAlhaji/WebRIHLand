package todo

default allow = false

# Admin panel
allow = true {
    input.method = "GET"
    input.path = ["admin"]
    input.user.email = "g@y.com"
    input.user.userType = "2"
}

# User panel
allow = true {
    input.method = "GET"
    input.path = ["mytodo"]
    input.user.userType = "1"
}