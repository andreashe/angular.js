'use strict';


function $TimeoutProvider() {
  this.$get = ['$rootScope', '$browser', '$q', '$$q', '$exceptionHandler',
       function($rootScope,   $browser,   $q,   $$q,   $exceptionHandler) {

    var deferreds = {};


     /**
      * @ngdoc service
      * @name $timeout
      *
      * @description
      * Angular's wrapper for `window.setTimeout`. The `fn` function is wrapped into a try/catch
      * block and delegates any exceptions to
      * {@link ng.$exceptionHandler $exceptionHandler} service.
      *
      * The return value of calling `$timeout` is a promise, which will be resolved when
      * the delay has passed and the timeout function, if provided, is executed.
      *
      * To cancel a timeout request, call `$timeout.cancel(promise)`.
      *
      * In tests you can use {@link ngMock.$timeout `$timeout.flush()`} to
      * synchronously flush the queue of deferred functions.
      *
      * If you only want a promise that will be resolved after some specified delay
      * then you can call `$timeout` without the `fn` function.
      * 
      * Here an example with TypeScript:
      * ```
      * var aPromise = $timeout( aFunctionToBeCalled, 3000 ); // 3 Seconds
      * 
      * // if you want to cancel the timer, you can now use the returned promise:
      * $timeout.cancel( aPromise );
      * ```
      * If the function (aFunctionToBeCalled) is called with no delay, you maybe used brackets
      * after the function name.
      * ```
      * var aPromise = $timeout( aFunctionToBeCalled(), 3000 ); // WRONG, no brackets!
      * ```
      * 
      * If you write a class and want to call a method of the running instance, the following 
      * example WON'T work:
      * ```
      * var aPromise = $timeout( this.aMethodToBeCalled, 3000 ); // WRONG!
      * ```
      * The aMethodToBeCalled-method will be called but with the wrong instance in 'this'. Instead of the class
      * instance, you will get a windows object, which does not help in class context. To solve that issue, you can
      * go this way:
      * ```
      * var aPromise = $timeout( function(){ this.aMethodToBeCalled() ), 3000 ); // OK, and with brackets
      * ```
      *
      * @param {function()=} fn A function, whose execution should be delayed.
      * @param {number=} [delay=0] Delay in milliseconds.
      * @param {boolean=} [invokeApply=true] If set to `false` skips model dirty checking, otherwise
      *   will invoke `fn` within the {@link ng.$rootScope.Scope#$apply $apply} block.
      * @param {...*=} Pass additional parameters to the executed function.
      * @returns {Promise} Promise that will be resolved when the timeout is reached. The value this
      *   promise will be resolved with is the return value of the `fn` function.
      *
      */
    function timeout(fn, delay, invokeApply) {
      if (!isFunction(fn)) {
        invokeApply = delay;
        delay = fn;
        fn = noop;
      }

      var args = sliceArgs(arguments, 3),
          skipApply = (isDefined(invokeApply) && !invokeApply),
          deferred = (skipApply ? $$q : $q).defer(),
          promise = deferred.promise,
          timeoutId;

      timeoutId = $browser.defer(function() {
        try {
          deferred.resolve(fn.apply(null, args));
        } catch (e) {
          deferred.reject(e);
          $exceptionHandler(e);
        }
        finally {
          delete deferreds[promise.$$timeoutId];
        }

        if (!skipApply) $rootScope.$apply();
      }, delay);

      promise.$$timeoutId = timeoutId;
      deferreds[timeoutId] = deferred;

      return promise;
    }


     /**
      * @ngdoc method
      * @name $timeout#cancel
      *
      * @description
      * Cancels a task associated with the `promise`. As a result of this, the promise will be
      * resolved with a rejection.
      *
      * @param {Promise=} promise Promise returned by the `$timeout` function.
      * @returns {boolean} Returns `true` if the task hasn't executed yet and was successfully
      *   canceled.
      */
    timeout.cancel = function(promise) {
      if (promise && promise.$$timeoutId in deferreds) {
        deferreds[promise.$$timeoutId].reject('canceled');
        delete deferreds[promise.$$timeoutId];
        return $browser.defer.cancel(promise.$$timeoutId);
      }
      return false;
    };

    return timeout;
  }];
}
