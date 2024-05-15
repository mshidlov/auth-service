# Contributing to Auth-Service

First off, thank you for considering contributing to Auth-Service. It's people like you that make Auth-Service such a great tool.

## Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check our Issues page on GitHub to see if someone else in the community has already created a ticket. If not, go ahead and make one!

## Fork & create a branch

If this is something you think you can fix, then fork Auth-Service and create a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):

```bash
git checkout -b feature/325-add-jwt-support
```


## Implement your fix or feature
At this point, you’re ready to make your changes! Feel free to ask for help; everyone is a beginner at first 😸

## Make a Pull Request
At this point, you should switch back to your master branch and make sure it’s up to date with Auth-Service’s master branch:
```
git remote add upstream git@github.com:mshidlov/auth-service.git
git checkout master
git pull upstream master
```
Then update your feature branch from your local copy of master, and push it!
```
git checkout feature/325-add-jwt-support
git rebase master
git push --set-upstream origin feature/325-add-jwt-support
```
Finally, go to GitHub and make a Pull Request 🚀

## Keeping your Pull Request updated
If a maintainer asks you to “rebase” your PR, they’re saying that a lot of code has changed, and that you need to update your branch so it’s easier to merge.

To learn more about rebasing in Git, there are a lot of good resources but here’s the suggested workflow:
```
git checkout feature/325-add-jwt-support
git pull --rebase upstream master
git push --force-with-lease feature/325-add-jwt-support
```
Merging a PR (maintainers only)
A PR can only be merged into master by a maintainer if:

- It is passing CI.
- It has been approved by at least two maintainers. If it was a maintainer who opened the PR, only one extra approval is needed.
- It has no requested changes.
- It is up to date with current master.
Any maintainer is allowed to merge a PR if all of these conditions are met.

## Standards
This project adheres to:

- Open Source Initiative
- Contributor Covenant

Be kind to each other. ❤️
