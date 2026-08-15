#!/usr/bin/env python3
import sys
import subprocess

def main():
    if len(sys.argv) < 4:
        print('Usage: python test/run.py <username> <password> <temperature>')
        return 1

    username, password, temp = sys.argv[1], sys.argv[2], sys.argv[3]
    cmd = ['node', 'test/run.js', username, password, temp]
    try:
        subprocess.check_call(cmd)
    except subprocess.CalledProcessError as e:
        print('node runner failed with', e.returncode)
        return e.returncode
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
